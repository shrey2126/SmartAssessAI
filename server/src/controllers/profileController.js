const Profile = require("../models/Profile");
const { ok, asyncHandler } = require("../utils/helpers");

const getMine = asyncHandler(async (req, res) => {
  let profile = await Profile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await Profile.create({
      user: req.user._id,
      fullName: req.user.name,
      email: req.user.email,
    });
  }
  return ok(res, { profile });
});

const upsert = asyncHandler(async (req, res) => {
  const allowed = [
    "fullName",
    "phone",
    "email",
    "location",
    "linkedinUrl",
    "githubUrl",
    "portfolioUrl",
    "skills",
    "education",
    "experience",
    "projects",
    "summary",
  ];
  const patch = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { ...patch, user: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  profile.completionPercent = require("../models/Profile").computeCompletion(profile);
  await profile.save();
  return ok(res, { profile }, "Profile saved");
});

module.exports = { getMine, upsert };
