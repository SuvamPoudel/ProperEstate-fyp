const mongoose = require("mongoose");

const landSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  province: { type: String, default: "" },
  district: { type: String, default: "" },
  city: { type: String, default: "" },
  price: { type: Number, default: 0 },
  areaSize: { type: String, default: "" },
  category: { type: String, default: "" },
  mainCategory: { type: String, default: "" },
  subCategory: { type: String, default: "" },
  image: { type: String, default: null },
  mediaFiles: [{ type: String }],
  lalpurjaImage: { type: String, default: null },
  mapUrl: { type: String, default: "" },
  myMapsUrl: { type: String, default: "" },
  ownerName: { type: String, default: "" },
  ownerPhone: { type: String, default: "" },
  ownerEmail: { type: String, default: "" },
  ownerId: { type: String, index: true },   // stored as string for compatibility
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  featured: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { strict: false }); // strict:false keeps any extra fields already in DB

module.exports = mongoose.model("Land", landSchema);
