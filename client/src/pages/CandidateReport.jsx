import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { Card, Badge } from "../components/ui/primitives";
import ScoreRing from "../components/charts/ScoreRing";
import ReportCharts from "../components/charts/ReportCharts";
import { verdictTone, formatDate } from "../lib/utils";

const reasonLabel = {
  submitted: "Submitted normally",
  camera_lost: "Terminated — candidate left camera",
  tab_switch: "Terminated — tab switch",
  integrity: "Terminated — integrity",
};

export default function CandidateReport() {
  const { interviewId } = useParams();
  const [pack, setPack] = useState(null);

  useEffect(() => {
    api.get(`/interviews/${interviewId}`).then(({ data }) => setPack(data.data));
  }, [interviewId]);

  if (!pack) return <p>Loading report…</p>;
  const { interview, profile } = pack;
  const rec = interview.recordingPath ? `/uploads/${interview.recordingPath}` : "";

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">{interview.application?.candidate?.name}</h1>
          <p className="text-ink-500">{interview.application?.jobRole?.title}</p>
          <p className="text-xs text-ink-400 mt-1">
            {interview.application?.candidate?.email} · {formatDate(interview.completedAt || interview.startedAt)}
          </p>
        </div>
        <span className={`h-fit rounded-full px-4 py-2 ${verdictTone(interview.verdict)}`}>{interview.verdict}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {interview.mockMode && <Badge>Demo mode</Badge>}
        <Badge>{reasonLabel[interview.terminationReason] || "Pending / in progress"}</Badge>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
        <ScoreRing value={interview.overallScore} label="Overall" />
        <ScoreRing value={interview.technicalScore} label="Technical" />
        <ScoreRing value={interview.mcqScore} label="MCQ /10" />
        <ScoreRing value={interview.codingScore} label="Coding /10" />
        <ScoreRing value={interview.confidenceScore} label="Presence" />
      </div>
      <Card>
        <h2 className="font-display text-xl mb-3">Session recording</h2>
        {rec ? (
          <video src={rec} controls className="w-full rounded-xl bg-black aspect-video" />
        ) : (
          <p className="text-sm text-ink-500">No recording was uploaded for this session.</p>
        )}
      </Card>
      <ReportCharts interview={interview} />
      <Card>
        <h2 className="font-display text-xl mb-2">Profile</h2>
        <p>{profile?.summary}</p>
        <div className="flex flex-wrap gap-2 mt-3">{(profile?.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}</div>
      </Card>
      <Card>
        <h2 className="font-display text-xl mb-4">Answers (admin review)</h2>
        {(interview.answers || []).map((a) => (
          <div key={a.questionIndex} className="mb-5 border-b border-ink-200 dark:border-ink-800 pb-4">
            <p className="font-medium">
              {a.questionType === "coding" ? "Coding" : "MCQ"} {a.questionIndex + 1}. {a.questionText}
            </p>
            {a.questionType === "mcq" && (
              <p className="text-sm mt-2">
                Selected: {a.selectedOption || "—"} {a.isCorrect ? "· correct" : "· incorrect / blank"}
                {interview.questions?.[a.questionIndex]?.correctAnswer && (
                  <span className="text-ink-400"> · key: {interview.questions[a.questionIndex].correctAnswer}</span>
                )}
              </p>
            )}
            {a.questionType === "coding" && (
              <pre className="text-xs mt-2 whitespace-pre-wrap bg-ink-950 text-white rounded-lg p-3 overflow-auto">{a.code || a.transcript}</pre>
            )}
            <p className="text-sm text-ink-500 mt-1">Technical {a.technicalScore} — {a.feedback}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
