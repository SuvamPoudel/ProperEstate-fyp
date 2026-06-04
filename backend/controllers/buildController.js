const BuildProject = require("../models/BuildProject");
const BuilderProfile = require("../models/BuilderProfile");
const { BuildOffer, ProgressUpdate } = require("../models/BuildOffer");
const User = require("../models/User");

// ═══════════════════════════════════════════════════════════════
//  BUILD PROJECTS
// ═══════════════════════════════════════════════════════════════

// POST /build/projects — create a new project pitch
const createProject = async (req, res) => {
  try {
    const {
      ownerId, ownerName, ownerEmail, ownerPhone,
      projectTitle, buildType, purpose,
      landStatus, landLocation, landArea, province, district, city,
      budgetMin, budgetMax, budgetFlexible,
      expectedStartDate, expectedDuration,
      description, floors, rooms, specialRequirements, preferredMaterials
    } = req.body;

    if (!ownerId || !projectTitle || !buildType || !purpose || !landStatus) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const referenceImages = req.files ? req.files.map(f => f.filename) : [];

    const project = new BuildProject({
      ownerId, ownerName, ownerEmail, ownerPhone,
      projectTitle, buildType, purpose,
      landStatus, landLocation, landArea, province, district, city,
      budgetMin: Number(budgetMin) || 0,
      budgetMax: Number(budgetMax) || 0,
      budgetFlexible: budgetFlexible === "true" || budgetFlexible === true,
      expectedStartDate: expectedStartDate || null,
      expectedDuration,
      description, floors: Number(floors) || 1,
      rooms: Number(rooms) || 0,
      specialRequirements, preferredMaterials,
      referenceImages
    });

    await project.save();
    res.status(201).json({ success: true, message: "Project posted successfully", project });
  } catch (err) {
    console.error("createProject error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/projects — list all open projects (for builders to browse)
const getProjects = async (req, res) => {
  try {
    const { status, buildType, purpose, ownerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    else filter.status = { $in: ["open", "negotiating"] };
    if (buildType) filter.buildType = buildType;
    if (purpose) filter.purpose = purpose;
    if (ownerId) { filter.ownerId = ownerId; delete filter.status; }

    const projects = await BuildProject.find(filter)
      .populate("ownerId", "name avatar email")
      .sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (err) {
    console.error("getProjects error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/projects/:id — single project detail
const getProject = async (req, res) => {
  try {
    const project = await BuildProject.findById(req.params.id)
      .populate("ownerId", "name avatar email phone")
      .populate("chosenBuilderId");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.json({ success: true, project });
  } catch (err) {
    console.error("getProject error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /build/projects/:id — update project (owner only)
const updateProject = async (req, res) => {
  try {
    const project = await BuildProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.ownerId.toString() !== req.body.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const allowed = ["projectTitle","buildType","purpose","landStatus","landLocation","landArea",
      "province","district","city","budgetMin","budgetMax","budgetFlexible","expectedStartDate",
      "expectedDuration","description","floors","rooms","specialRequirements","preferredMaterials","status"];
    allowed.forEach(k => { if (req.body[k] !== undefined) project[k] = req.body[k]; });
    await project.save();
    res.json({ success: true, message: "Project updated", project });
  } catch (err) {
    console.error("updateProject error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /build/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await BuildProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    await BuildProject.findByIdAndDelete(req.params.id);
    await BuildOffer.deleteMany({ projectId: req.params.id });
    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error("deleteProject error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════
//  BUILDER PROFILES
// ═══════════════════════════════════════════════════════════════

// POST /build/builder-profile — register as a builder
const createBuilderProfile = async (req, res) => {
  try {
    const {
      userId, companyName, companyType, registrationNumber, establishedYear,
      address, province, district, city, website, phone, email,
      description, specializations, yearsOfExperience, completedProjects,
      workers, proofDocType
    } = req.body;

    if (!userId || !companyName) {
      return res.status(400).json({ success: false, message: "userId and companyName are required" });
    }

    const existing = await BuilderProfile.findOne({ userId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Builder profile already exists. Use update instead." });
    }

    const proofDocuments = req.files ? req.files.map(f => f.filename) : [];

    let parsedWorkers = [];
    try { parsedWorkers = typeof workers === "string" ? JSON.parse(workers) : (workers || []); } catch {}
    let parsedSpecs = [];
    try { parsedSpecs = typeof specializations === "string" ? JSON.parse(specializations) : (specializations || []); } catch {}

    const profile = new BuilderProfile({
      userId, companyName,
      companyType: companyType || "company",
      registrationNumber, establishedYear: Number(establishedYear) || null,
      address, province, district, city, website, phone, email,
      description,
      specializations: parsedSpecs,
      yearsOfExperience: Number(yearsOfExperience) || 0,
      completedProjects: Number(completedProjects) || 0,
      workers: parsedWorkers,
      proofDocuments,
      proofDocType: proofDocType || "",
      verificationStatus: "pending"
    });

    await profile.save();
    res.status(201).json({ success: true, message: "Builder profile submitted for review", profile });
  } catch (err) {
    console.error("createBuilderProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/builder-profile/me/:userId
const getMyBuilderProfile = async (req, res) => {
  try {
    const profile = await BuilderProfile.findOne({ userId: req.params.userId });
    res.json({ success: true, profile: profile || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/builders — list approved builders
const getBuilders = async (req, res) => {
  try {
    const builders = await BuilderProfile.find({ verificationStatus: "approved" })
      .populate("userId", "name avatar")
      .sort({ averageRating: -1, createdAt: -1 });
    res.json({ success: true, builders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /build/builder-profile/:id — update profile
const updateBuilderProfile = async (req, res) => {
  try {
    const profile = await BuilderProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    if (profile.userId.toString() !== req.body.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const allowed = ["companyName","companyType","registrationNumber","establishedYear","address",
      "province","district","city","website","phone","email","description","specializations",
      "yearsOfExperience","completedProjects","workers","proofDocType"];
    allowed.forEach(k => { if (req.body[k] !== undefined) profile[k] = req.body[k]; });
    if (req.files && req.files.length > 0) {
      profile.proofDocuments = [...profile.proofDocuments, ...req.files.map(f => f.filename)];
      profile.verificationStatus = "pending"; // re-review on new docs
    }
    await profile.save();
    res.json({ success: true, message: "Profile updated", profile });
  } catch (err) {
    console.error("updateBuilderProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════
//  OFFERS & NEGOTIATION
// ═══════════════════════════════════════════════════════════════

// POST /build/offers — builder submits an offer
const createOffer = async (req, res) => {
  try {
    const { projectId, builderId, builderUserId, proposedBudget, estimatedDuration, coverLetter, milestones } = req.body;
    if (!projectId || !builderId || !builderUserId || !proposedBudget) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // Check builder is approved
    const builder = await BuilderProfile.findById(builderId);
    if (!builder || builder.verificationStatus !== "approved") {
      return res.status(403).json({ success: false, message: "Builder not verified" });
    }

    // Check project is open
    const project = await BuildProject.findById(projectId);
    if (!project || !["open", "negotiating"].includes(project.status)) {
      return res.status(400).json({ success: false, message: "Project is not accepting offers" });
    }

    // Prevent duplicate offer
    const existing = await BuildOffer.findOne({ projectId, builderId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already submitted an offer for this project" });
    }

    let parsedMilestones = [];
    try { parsedMilestones = typeof milestones === "string" ? JSON.parse(milestones) : (milestones || []); } catch {}

    const offer = new BuildOffer({
      projectId, builderId, builderUserId,
      proposedBudget: Number(proposedBudget),
      estimatedDuration, coverLetter,
      milestones: parsedMilestones
    });
    await offer.save();

    // Update project status to negotiating
    if (project.status === "open") {
      project.status = "negotiating";
      await project.save();
    }

    res.status(201).json({ success: true, message: "Offer submitted", offer });
  } catch (err) {
    console.error("createOffer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/offers/project/:projectId — all offers for a project (owner sees)
const getOffersForProject = async (req, res) => {
  try {
    const offers = await BuildOffer.find({ projectId: req.params.projectId })
      .populate("builderId")
      .populate("builderUserId", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/offers/builder/:builderUserId — offers submitted by a builder
const getOffersByBuilder = async (req, res) => {
  try {
    const offers = await BuildOffer.find({ builderUserId: req.params.builderUserId })
      .populate("projectId")
      .sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /build/offers/:id/negotiate — add a negotiation round
const negotiate = async (req, res) => {
  try {
    const { by, userId, proposedBudget, proposedDuration, message } = req.body;
    const offer = await BuildOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

    offer.negotiations.push({ by, userId, proposedBudget: Number(proposedBudget), proposedDuration, message });
    offer.status = "negotiating";
    // Update the current proposed values
    if (proposedBudget) offer.proposedBudget = Number(proposedBudget);
    if (proposedDuration) offer.estimatedDuration = proposedDuration;
    await offer.save();

    res.json({ success: true, message: "Negotiation round added", offer });
  } catch (err) {
    console.error("negotiate error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /build/offers/:id/respond — client accepts or rejects an offer
const respondToOffer = async (req, res) => {
  try {
    const { status, agreedBudget, agreedDuration, userId } = req.body;
    const offer = await BuildOffer.findById(req.params.id).populate("projectId");
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

    // Verify the caller is the project owner
    if (offer.projectId.ownerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the project owner can respond" });
    }

    offer.status = status; // "accepted" | "rejected"
    if (status === "accepted") {
      offer.agreedBudget = Number(agreedBudget) || offer.proposedBudget;
      offer.agreedDuration = agreedDuration || offer.estimatedDuration;
      offer.dealDoneAt = new Date();

      // Update project
      const project = await BuildProject.findById(offer.projectId._id);
      project.status = "deal_done";
      project.chosenBuilderId = offer.builderId;
      await project.save();

      // Reject all other offers
      await BuildOffer.updateMany(
        { projectId: offer.projectId._id, _id: { $ne: offer._id } },
        { status: "rejected" }
      );
    }
    await offer.save();

    res.json({ success: true, message: `Offer ${status}`, offer });
  } catch (err) {
    console.error("respondToOffer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PROGRESS UPDATES
// ═══════════════════════════════════════════════════════════════

// POST /build/progress — builder posts a progress update
const createProgressUpdate = async (req, res) => {
  try {
    const { projectId, builderId, builderUserId, title, description, percentComplete, milestone } = req.body;
    if (!projectId || !builderId || !builderUserId || !title) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const images = req.files ? req.files.map(f => f.filename) : [];

    const update = new ProgressUpdate({
      projectId, builderId, builderUserId,
      title, description,
      percentComplete: Number(percentComplete) || 0,
      milestone,
      images
    });
    await update.save();

    // If 100% complete, mark project as completed
    if (Number(percentComplete) >= 100) {
      await BuildProject.findByIdAndUpdate(projectId, { status: "completed" });
    } else {
      await BuildProject.findByIdAndUpdate(projectId, { status: "in_progress" });
    }

    res.status(201).json({ success: true, message: "Progress update posted", update });
  } catch (err) {
    console.error("createProgressUpdate error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/progress/:projectId — all updates for a project
const getProgressUpdates = async (req, res) => {
  try {
    const updates = await ProgressUpdate.find({ projectId: req.params.projectId })
      .populate("builderUserId", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /build/progress/:updateId/comment — client adds comment/question
const addComment = async (req, res) => {
  try {
    const { userId, userName, text, type } = req.body;
    const update = await ProgressUpdate.findById(req.params.updateId);
    if (!update) return res.status(404).json({ success: false, message: "Update not found" });

    update.comments.push({ userId, userName, text, type: type || "comment" });
    await update.save();
    res.json({ success: true, message: "Comment added", update });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /build/progress/:updateId/reply/:commentId — builder replies to comment
const replyToComment = async (req, res) => {
  try {
    const { reply } = req.body;
    const update = await ProgressUpdate.findById(req.params.updateId);
    if (!update) return res.status(404).json({ success: false, message: "Update not found" });

    const comment = update.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    comment.reply = reply;
    comment.repliedAt = new Date();
    await update.save();
    res.json({ success: true, message: "Reply added", update });
  } catch (err) {
    console.error("replyToComment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════════════

// GET /build/admin/builders — all builder profiles for admin review
const adminGetBuilders = async (req, res) => {
  try {
    const builders = await BuilderProfile.find()
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, builders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /build/admin/builders/:id/verify — approve or reject builder
const adminVerifyBuilder = async (req, res) => {
  try {
    const { status, adminNote } = req.body; // "approved" | "rejected"
    const profile = await BuilderProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, adminNote: adminNote || "", verifiedAt: new Date() },
      { new: true }
    ).populate("userId", "name email");

    if (!profile) return res.status(404).json({ success: false, message: "Builder not found" });
    res.json({ success: true, message: `Builder ${status}`, profile });
  } catch (err) {
    console.error("adminVerifyBuilder error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /build/admin/projects — all projects for admin
const adminGetProjects = async (req, res) => {
  try {
    const projects = await BuildProject.find()
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /build/admin/builders/:id — admin deletes builder profile
const deleteBuilderProfile = async (req, res) => {
  try {
    const profile = await BuilderProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: "Builder not found" });
    await BuilderProfile.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Builder profile deleted successfully" });
  } catch (err) {
    console.error("deleteBuilderProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createProject, getProjects, getProject, updateProject, deleteProject,
  createBuilderProfile, getMyBuilderProfile, getBuilders, updateBuilderProfile,
  createOffer, getOffersForProject, getOffersByBuilder, negotiate, respondToOffer,
  createProgressUpdate, getProgressUpdates, addComment, replyToComment,
  adminGetBuilders, adminVerifyBuilder, adminGetProjects, deleteBuilderProfile
};
