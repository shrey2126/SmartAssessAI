module.exports = {
  technicalWeight: Number(process.env.TECHNICAL_WEIGHT || 0.6),
  confidenceWeight: Number(process.env.CONFIDENCE_WEIGHT || 0.4),
  mcqWeight: Number(process.env.MCQ_WEIGHT || 0.5),
  codingWeight: Number(process.env.CODING_WEIGHT || 0.5),
  verdict: {
    strong: Number(process.env.VERDICT_STRONG || 8.5),
    hire: Number(process.env.VERDICT_HIRE || 7),
    borderline: Number(process.env.VERDICT_BORDERLINE || 5.5),
  },
};
