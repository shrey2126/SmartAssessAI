import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Radar, Line, Doughnut } from "react-chartjs-2";
import { Card } from "../ui/primitives";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

const mono = {
  plugins: {
    legend: { labels: { color: "#71717a" } },
    tooltip: { backgroundColor: "#111111" },
  },
};

export default function ReportCharts({ interview }) {
  const tech = interview.technicalScore || 0;
  const conf = interview.confidenceScore || 0;
  const mcq = interview.mcqScore || 0;
  const coding = interview.codingScore || 0;
  const perQ = (interview.answers || []).map((a) => a.technicalScore);
  const labels = (interview.answers || []).map((a) =>
    a.questionType === "coding" ? `Code ${a.questionIndex + 1}` : `MCQ ${a.questionIndex + 1}`
  );
  const eye = interview.gazeData?.eyeContactRatio || 0;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <p className="text-sm mb-2">Technical vs Confidence</p>
        <Bar
          data={{
            labels: ["Scores"],
            datasets: [
              { label: "MCQ", data: [mcq], backgroundColor: "#111111" },
              { label: "Coding", data: [coding], backgroundColor: "#52525b" },
              { label: "Presence", data: [conf], backgroundColor: "#a1a1aa" },
            ],
          }}
          options={mono}
        />
      </Card>
      <Card>
        <p className="text-sm mb-2">Skill areas (derived)</p>
        <Radar
          data={{
            labels: ["Correctness", "Relevance", "Depth", "Clarity", "Presence"],
            datasets: [
              {
                label: "Profile",
                data: [tech, Math.min(10, tech + 0.4), Math.max(0, tech - 0.6), conf, eye * 10],
                borderColor: "#111111",
                backgroundColor: "rgba(17,17,17,0.15)",
              },
            ],
          }}
          options={mono}
        />
      </Card>
      <Card>
        <p className="text-sm mb-2">Per-question technical</p>
        <Line
          data={{
            labels,
            datasets: [{ label: "Score", data: perQ, borderColor: "#111111", tension: 0.3 }],
          }}
          options={{ ...mono, scales: { y: { max: 10 } } }}
        />
      </Card>
      <Card>
        <p className="text-sm mb-2">Eye contact vs look-away</p>
        <Doughnut
          data={{
            labels: ["Eye contact", "Look-away"],
            datasets: [{ data: [Math.round(eye * 100), Math.round((1 - eye) * 100)], backgroundColor: ["#111111", "#d4d4d8"] }],
          }}
          options={mono}
        />
      </Card>
    </div>
  );
}
