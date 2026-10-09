const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ["static", "dynamic", "mcq"], default: "static" },
    idealAnswerHint: { type: String, default: "" },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: "" },
  },
  { _id: false }
);

const jobRoleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    details: {
      responsibilities: { type: String, default: "" },
      requirements: { type: String, default: "" },
      location: { type: String, default: "Remote" },
      type: { type: String, default: "Full-time" },
      experienceLevel: { type: String, default: "Mid" },
    },
    skills: { type: [String], default: [] },
    questions: {
      type: [questionSchema],
      default: [],
    },
    isOpen: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobRole", jobRoleSchema);
