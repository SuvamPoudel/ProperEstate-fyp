const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const c = require("../controllers/buildController");

// ── Projects ──────────────────────────────────────────────────────────────────
router.post("/build/projects", upload.array("referenceImages", 10), c.createProject);
router.get("/build/projects", c.getProjects);
router.get("/build/projects/:id", c.getProject);
router.put("/build/projects/:id", c.updateProject);
router.delete("/build/projects/:id", c.deleteProject);

// ── Builder Profiles ──────────────────────────────────────────────────────────
router.post("/build/builder-profile", upload.array("proofDocuments", 5), c.createBuilderProfile);
router.get("/build/builder-profile/me/:userId", c.getMyBuilderProfile);
router.get("/build/builders", c.getBuilders);
router.put("/build/builder-profile/:id", upload.array("proofDocuments", 5), c.updateBuilderProfile);

// ── Offers & Negotiation ──────────────────────────────────────────────────────
router.post("/build/offers", c.createOffer);
router.get("/build/offers/project/:projectId", c.getOffersForProject);
router.get("/build/offers/builder/:builderUserId", c.getOffersByBuilder);
router.post("/build/offers/:id/negotiate", c.negotiate);
router.post("/build/offers/:id/respond", c.respondToOffer);

// ── Progress Updates ──────────────────────────────────────────────────────────
router.post("/build/progress", upload.array("images", 10), c.createProgressUpdate);
router.get("/build/progress/:projectId", c.getProgressUpdates);
router.post("/build/progress/:updateId/comment", c.addComment);
router.post("/build/progress/:updateId/reply/:commentId", c.replyToComment);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get("/build/admin/builders", c.adminGetBuilders);
router.post("/build/admin/builders/:id/verify", c.adminVerifyBuilder);
router.delete("/build/admin/builders/:id", c.deleteBuilderProfile);
router.get("/build/admin/projects", c.adminGetProjects);

module.exports = router;
