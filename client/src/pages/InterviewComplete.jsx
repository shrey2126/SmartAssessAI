import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
import { Button, Card, Badge } from "../components/ui/primitives";
import ScoreRing from "../components/charts/ScoreRing";
import ReportCharts from "../components/charts/ReportCharts";
import { verdictTone } from "../lib/utils";

const reasonLabel = {
  submitted: "Submitted",
  camera_lost: "Ended — face not visible",
  tab_switch: "Ended — left the test tab",
  integrity: "Ended — integrity violation",
};

export default function InterviewComplete() {
  const { applicationId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/interviews/by-application/${applicationId}`)
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.userMessage || "Could not load interview result"));
  }, [applicationId]);

  if (error) return <div className="p-8">{error}</div>;
  if (!data) return <div className="p-8">Loading result…</div>;
  const i = data.interview;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-16">
      <h1 className="font-display text-4xl">Your result</h1>
      <p className="text-ink-500">
        {reasonLabel[i.terminationReason] || "Interview complete"} · {i.application?.jobRole?.title}
      </p>
      {i.mockMode && <Badge>Demo mode</Badge>}
      {i.terminationReason && i.terminationReason !== "submitted" && (
        <Card className="text-sm">
          The test ended early. Scores include only what you completed; unanswered items count as zero.
        </Card>
      )}
      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
        <ScoreRing value={i.overallScore} label="Overall" />
        <ScoreRing value={i.technicalScore} label="Technical" />
        <ScoreRing value={i.mcqScore} label="MCQ" />
        <ScoreRing value={i.codingScore} label="Coding" />
        <ScoreRing value={i.confidenceScore} label="Presence" />
      </div>
      <span className={`inline-flex rounded-full px-4 py-2 text-sm ${verdictTone(i.verdict)}`}>{i.verdict}</span>
      <ReportCharts interview={i} />
      <Card>
        <h2 className="font-display text-xl mb-3">Per-question</h2>
        <div className="space-y-4">
          {(i.answers || []).map((a) => (
            <div key={a.questionIndex} className="border-b border-ink-200 dark:border-ink-800 pb-3">
              <p className="font-medium">
                {a.questionType === "coding" ? "Code" : "MCQ"} {a.questionIndex + 1}. {a.questionText}
              </p>
              <p className="text-sm text-ink-500 mt-1 whitespace-pre-wrap">{a.transcript}</p>
              <p className="text-sm mt-1">Score {a.technicalScore} — {a.feedback}</p>
            </div>
          ))}
        </div>
      </Card>
      <Link to="/app"><Button>Back to dashboard</Button></Link>
    </div>
  );
}
