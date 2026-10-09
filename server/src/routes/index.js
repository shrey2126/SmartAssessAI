const express = require("express");
const { requireAuth, requireAdmin, requireCandidate } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const auth = require("../controllers/authController");
const profile = require("../controllers/profileController");
const roles = require("../controllers/roleController");
const applications = require("../controllers/applicationController");
const interviews = require("../controllers/interviewController");
const dashboard = require("../controllers/dashboardController");
const ai = require("../services/aiClient");
const { ok, asyncHandler } = require("../utils/helpers");

const router = express.Router();

router.post("/auth/register", auth.registerRules, auth.register);
router.post("/auth/login", auth.loginRules, auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAuth, auth.me);

router.get("/profile", requireAuth, requireCandidate, profile.getMine);
router.put("/profile", requireAuth, requireCandidate, profile.upsert);

router.get("/roles", roles.publicList);
router.get("/roles/:id", roles.publicOne);
router.get("/admin/roles", requireAuth, requireAdmin, roles.adminList);
router.post("/admin/roles/generate-questions", requireAuth, requireAdmin, roles.generateQuestions);
router.post("/admin/roles", requireAuth, requireAdmin, roles.roleRules, roles.create);
router.get("/admin/roles/:id", requireAuth, requireAdmin, roles.adminOne);
router.put("/admin/roles/:id", requireAuth, requireAdmin, roles.update);
router.delete("/admin/roles/:id", requireAuth, requireAdmin, roles.remove);
router.patch("/admin/roles/:id/toggle", requireAuth, requireAdmin, roles.toggle);

router.get("/applications/me", requireAuth, requireCandidate, applications.mine);
router.post("/applications/:roleId", requireAuth, requireCandidate, applications.apply);
router.get("/admin/applications", requireAuth, requireAdmin, applications.adminList);

router.post("/interviews/start/:applicationId", requireAuth, interviews.start);
router.get("/interviews/by-application/:applicationId", requireAuth, interviews.byApplication);
router.post(
  "/interviews/:id/answers",
  requireAuth,
  upload.single("audio"),
  interviews.submitAnswer
);
router.post("/interviews/:id/proctor", requireAuth, interviews.proctor);
router.post(
  "/interviews/:id/recording",
  requireAuth,
  upload.single("recording"),
  interviews.uploadRecording
);
router.post("/interviews/:id/complete", requireAuth, interviews.complete);
router.get("/interviews/:id", requireAuth, interviews.getOne);

router.get("/admin/dashboard", requireAuth, requireAdmin, dashboard.stats);
router.get("/admin/export.csv", requireAuth, requireAdmin, dashboard.exportCsv);

router.get(
  "/ai/status",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const status = await ai.health();
    return ok(res, status);
  })
);

module.exports = router;
