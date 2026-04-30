const mongoose = require("mongoose");

// ── Builder / Construction Company Profile ────────────────────────────────────
const builderProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

  // Company / Team info
  companyName:        { type: String, required: true },
  companyType: {
    type: String,
    enum: ["company", "contractor", "freelance_team", "individual"],
    default: "company"
  },
  registrationNumber: { type: String, default: "" },
  establishedYear:    { type: Number, default: null },
  address:            { type: String, default: "" },
  province:           { type: String, default: "" },
  district:           { type: String, default: "" },
  city:               { type: String, default: "" },
  website:            { type: String, default: "" },
  phone:              { type: String, default: "" },
  email:              { type: String, default: "" },

  // Description
  description:        { type: String, default: "" },
  specializations:    [{ type: String }],
  yearsOfExperience:  { type: Number, default: 0 },
  completedProjects:  { type: Number, default: 0 },

  // Workers / Team
  workers: [{
    name:       { type: String },
    role:       { type: String },
    experience: { type: String }
  }],

  // Legitimacy proof (confidential — admin only)
  proofDocuments: [{ type: String }],
  proofDocType:   { type: String, default: "" },

  // Admin review
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  adminNote:  { type: String, default: "" },
  verifiedAt: { type: Date, default: null },

  // Portfolio images
  portfolioImages: [{ type: String }],

  // Rating
  averageRating: { type: Number, default: 0 },
  totalRatings:  { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BuilderProfile", builderProfileSchema);
