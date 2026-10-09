const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    passingYear: String,
    cgpa: String,
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: String,
    company: String,
    startDate: String,
    endDate: String,
    description: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: String,
    techStack: [String],
    objective: String,
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    portfolioUrl: { type: String, default: "" },
    skills: { type: [String], default: [] },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    summary: { type: String, default: "" },
    completionPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

function computeCompletion(doc) {
  const checks = [
    !!doc.fullName,
    !!doc.phone,
    !!doc.email,
    !!doc.location,
    !!doc.linkedinUrl || !!doc.githubUrl || !!doc.portfolioUrl,
    (doc.skills || []).length >= 3,
    (doc.education || []).some((e) => e.degree && e.institution),
    (doc.experience || []).some((e) => e.jobTitle && e.company),
    (doc.projects || []).some((p) => p.title),
    !!doc.summary,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

profileSchema.pre("save", function (next) {
  this.completionPercent = computeCompletion(this);
  next();
});

module.exports = mongoose.model("Profile", profileSchema);
module.exports.computeCompletion = computeCompletion;
