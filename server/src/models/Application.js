const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobRole: { type: mongoose.Schema.Types.ObjectId, ref: "JobRole", required: true },
    status: {
      type: String,
      enum: ["applied", "interviewing", "completed"],
      default: "applied",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

applicationSchema.index({ candidate: 1, jobRole: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
