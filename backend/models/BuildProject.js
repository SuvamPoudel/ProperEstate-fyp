const mongoose = require("mongoose");

// ── Build Project (user's construction pitch) ─────────────────────────────────
const buildProjectSchema = new mongoose.Schema({
  // Owner
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ownerName: { type: String, default: "" },
  ownerEmail: { type: String, default: "" },
  ownerPhone: { type: String, default: "" },

  // What they want to build
  projectTitle: { type: String, required: true },
  buildType: {
    type: String,
    enum: ["house", "villa", "apartment", "commercial", "restaurant", "gym", "swimming_pool", "warehouse", "office", "hotel", "other"],
    required: true
  },
  purpose: {
    type: String,
    enum: ["personal_use", "business", "lease_rent", "resale", "restaurant", "gym", "hotel", "mixed_use", "other"],
    required: true
  },

  // Land situation
  landStatus: {
    type: String,
    enum: ["own_land", "need_land", "land_in_process"],
    required: true
  },
  landLocation: { type: String, default: "" },
  landArea:     { type: String, default: "" },
  province:     { type: String, default: "" },
  district:     { type: String, default: "" },
  city:         { type: String, default: "" },

  // Budget
  budgetMin:      { type: Number, default: 0 },
  budgetMax:      { type: Number, default: 0 },
  budgetCurrency: { type: String, default: "NPR" },
  budgetFlexible: { type: Boolean, default: false },

  // Timeline
  expectedStartDate: { type: Date, default: null },
  expectedDuration:  { type: String, default: "" },

  // Project details
  description:        { type: String, default: "" },
  floors:             { type: Number, default: 1 },
  rooms:              { type: Number, default: 0 },
  specialRequirements:{ type: String, default: "" },
  preferredMaterials: { type: String, default: "" },
  referenceImages:    [{ type: String }],

  // Status
  status: {
    type: String,
    enum: ["open", "negotiating", "deal_done", "in_progress", "completed", "cancelled"],
    default: "open",
    index: true
  },

  // Chosen builder (after deal)
  chosenBuilderId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProfile", default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BuildProject", buildProjectSchema);
