const mongoose = require("mongoose");

// ── Build Offer (builder bids on a project) ───────────────────────────────────
const buildOfferSchema = new mongoose.Schema({
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: "BuildProject", required: true, index: true },
  builderId:     { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProfile", required: true, index: true },
  builderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Offer details
  proposedBudget:    { type: Number, required: true },
  estimatedDuration: { type: String, default: "" },
  coverLetter:       { type: String, default: "" },
  milestones: [{
    title:         { type: String },
    description:   { type: String },
    estimatedDays: { type: Number },
    amount:        { type: Number }
  }],

  // Negotiation history
  negotiations: [{
    by:              { type: String, enum: ["client", "builder"] },
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    proposedBudget:  { type: Number },
    proposedDuration:{ type: String },
    message:         { type: String },
    createdAt:       { type: Date, default: Date.now }
  }],

  // Status
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "negotiating", "withdrawn"],
    default: "pending",
    index: true
  },

  // Final agreed terms
  agreedBudget:   { type: Number, default: null },
  agreedDuration: { type: String, default: "" },
  dealDoneAt:     { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ── Progress Update (builder posts updates after deal) ────────────────────────
const progressUpdateSchema = new mongoose.Schema({
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: "BuildProject", required: true, index: true },
  builderId:     { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProfile", required: true },
  builderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  title:           { type: String, required: true },
  description:     { type: String, default: "" },
  images:          [{ type: String }],
  percentComplete: { type: Number, default: 0, min: 0, max: 100 },
  milestone:       { type: String, default: "" },

  // Client queries/comments on this update
  comments: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName:  { type: String },
    text:      { type: String },
    type:      { type: String, enum: ["comment", "question", "request"], default: "comment" },
    createdAt: { type: Date, default: Date.now },
    reply:     { type: String, default: "" },
    repliedAt: { type: Date, default: null }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  BuildOffer:     mongoose.model("BuildOffer", buildOfferSchema),
  ProgressUpdate: mongoose.model("ProgressUpdate", progressUpdateSchema)
};
