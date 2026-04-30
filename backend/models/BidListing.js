const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  bidderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bidderName: { type: String, required: true },
  amount:     { type: Number, required: true },
  createdAt:  { type: Date, default: Date.now },
});

const bidListingSchema = new mongoose.Schema({
  // Property details
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  location:     { type: String, default: "" },
  province:     { type: String, default: "" },
  district:     { type: String, default: "" },
  city:         { type: String, default: "" },
  mapUrl:       { type: String, default: "" },
  areaSize:     { type: String, default: "" },
  mainCategory: { type: String, default: "" },
  subCategory:  { type: String, default: "" },
  image:        { type: String, default: null },
  mediaFiles:   [{ type: String }],

  // Seller
  sellerId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerName:   { type: String, required: true },
  sellerPhone:  { type: String, default: "" },
  sellerEmail:  { type: String, default: "" },

  // Bidding config
  startingPrice:  { type: Number, required: true },
  reservePrice:   { type: Number, default: 0 },   // 0 = no reserve
  minIncrement:   { type: Number, default: 1000 }, // minimum bid step
  auctionStart:   { type: Date, required: true },
  auctionEnd:     { type: Date, required: true },

  // Status
  status: {
    type: String,
    enum: ["pending", "approved", "active", "ended", "sold", "rejected"],
    default: "pending",
    index: true,
  },

  // Bids
  bids:         [bidSchema],
  currentBid:   { type: Number, default: 0 },
  currentBidder:{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  currentBidderName: { type: String, default: "" },

  // Payment
  listingFeePaid: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

// Virtual: is auction live right now?
bidListingSchema.virtual("isLive").get(function () {
  const now = new Date();
  return this.status === "active" && now >= this.auctionStart && now <= this.auctionEnd;
});

module.exports = mongoose.model("BidListing", bidListingSchema);
