const BidListing = require("../models/BidListing");
const User = require("../models/User");
const upload = require("../config/multer");

// ── Create a new bid listing (seller only, after payment) ─────────────────
const createBidListing = async (req, res) => {
  try {
    const seller = await User.findById(req.body.sellerId);
    if (!seller || (seller.accountType !== "seller" && seller.role !== "admin")) {
      return res.status(403).json({ success: false, error: "Seller account required to post a bid listing." });
    }

    const mediaFiles = req.files ? req.files.map(f => f.filename) : [];
    const image = mediaFiles[0] || null;

    const listing = new BidListing({
      ...req.body,
      image,
      mediaFiles,
      sellerName:  seller.name,
      sellerPhone: seller.phone || "",
      sellerEmail: seller.email || "",
      currentBid:  parseInt(req.body.startingPrice) || 0,
      listingFeePaid: true,
      status: "pending", // admin must approve
    });

    await listing.save();
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Get all approved/active listings with filters ─────────────────────────
const getBidListings = async (req, res) => {
  try {
    const { category, province, district, status, search, sort } = req.query;
    const query = { status: { $in: ["active", "ended", "sold"] } };

    if (status && ["active","ended","sold","pending"].includes(status)) {
      query.status = status;
    }    if (category)  query.mainCategory = new RegExp(category, "i");
    if (province)  query.province = new RegExp(province, "i");
    if (district)  query.district = new RegExp(district, "i");
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const sortObj = sort === "ending_soon"
      ? { auctionEnd: 1 }
      : sort === "highest_bid"
      ? { currentBid: -1 }
      : sort === "lowest_start"
      ? { startingPrice: 1 }
      : { createdAt: -1 };

    const listings = await BidListing.find(query).sort(sortObj).limit(50);
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Get single listing ────────────────────────────────────────────────────
const getBidListing = async (req, res) => {
  try {
    const listing = await BidListing.findById(req.params.id)
      .populate("sellerId", "name email phone avatar")
      .populate("currentBidder", "name avatar");
    if (!listing) return res.status(404).json({ success: false, error: "Listing not found" });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Place a bid ───────────────────────────────────────────────────────────
const placeBid = async (req, res) => {
  try {
    const { bidderId, bidderName, amount } = req.body;
    const listing = await BidListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: "Listing not found" });

    const now = new Date();
    if (listing.status !== "active") {
      return res.status(400).json({ success: false, error: "This auction is not active." });
    }
    if (now < listing.auctionStart) {
      return res.status(400).json({ success: false, error: "Auction has not started yet." });
    }
    if (now > listing.auctionEnd) {
      listing.status = "ended";
      await listing.save();
      return res.status(400).json({ success: false, error: "Auction has ended." });
    }

    const bidAmount = parseInt(amount);
    const minRequired = (listing.currentBid || listing.startingPrice) + listing.minIncrement;

    if (bidAmount < minRequired) {
      return res.status(400).json({
        success: false,
        error: `Minimum bid is Rs. ${minRequired.toLocaleString()} (current + Rs. ${listing.minIncrement.toLocaleString()} increment)`,
      });
    }

    if (listing.sellerId.toString() === bidderId.toString()) {
      return res.status(400).json({ success: false, error: "You cannot bid on your own listing." });
    }

    // Add bid
    listing.bids.push({ bidderId, bidderName, amount: bidAmount });
    listing.currentBid = bidAmount;
    listing.currentBidder = bidderId;
    listing.currentBidderName = bidderName;
    await listing.save();

    // Emit via socket if available
    if (req.app.get("io")) {
      req.app.get("io").to(`bid_${listing._id}`).emit("new_bid", {
        listingId: listing._id,
        amount: bidAmount,
        bidderName,
        totalBids: listing.bids.length,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, currentBid: bidAmount, totalBids: listing.bids.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: approve listing ────────────────────────────────────────────────
const approveBidListing = async (req, res) => {
  try {
    const listing = await BidListing.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin: reject listing ─────────────────────────────────────────────────
const rejectBidListing = async (req, res) => {
  try {
    const listing = await BidListing.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Auto-end expired auctions (called periodically) ───────────────────────
const endExpiredAuctions = async () => {
  try {
    const expired = await BidListing.find({
      status: "active",
      auctionEnd: { $lt: new Date() },
    });
    for (const l of expired) {
      l.status = l.currentBidder ? "sold" : "ended";
      await l.save();
    }
    if (expired.length > 0) console.log(`✅ Ended ${expired.length} expired auctions`);
  } catch (err) {
    console.error("Auto-end error:", err.message);
  }
};

// Run every 60 seconds
setInterval(endExpiredAuctions, 60 * 1000);

module.exports = {
  createBidListing,
  getBidListings,
  getBidListing,
  placeBid,
  approveBidListing,
  rejectBidListing,
  upload,
};
