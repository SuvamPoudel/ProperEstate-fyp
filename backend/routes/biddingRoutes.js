const express = require("express");
const router  = express.Router();
const upload  = require("../config/multer");
const {
  createBidListing,
  getBidListings,
  getBidListing,
  placeBid,
  approveBidListing,
  rejectBidListing,
} = require("../controllers/biddingController");

// Public
router.get("/bid-listings",        getBidListings);
router.get("/bid-listings/:id",    getBidListing);

// Authenticated (no JWT middleware — uses sellerId from body like the rest of the app)
router.post("/bid-listings",       upload.array("media", 6), createBidListing);
router.post("/bid-listings/:id/bid", placeBid);

// Admin
router.post("/bid-listings/:id/approve", approveBidListing);
router.post("/bid-listings/:id/reject",  rejectBidListing);
router.post("/bid-listings/:id/cancel",  async (req, res) => {
  try {
    const BidListing = require("../models/BidListing");
    const listing = await BidListing.findByIdAndUpdate(req.params.id, { status:"rejected" }, { new:true });
    res.json({ success:true, listing });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});
router.delete("/bid-listings/:id", async (req, res) => {
  try {
    const BidListing = require("../models/BidListing");
    await BidListing.findByIdAndDelete(req.params.id);
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});
// Admin: get all bid listings regardless of status
router.get("/admin/bid-listings", async (req, res) => {
  try {
    const BidListing = require("../models/BidListing");
    const { status, category } = req.query;
    const q = {};
    if (status) q.status = status;
    if (category) q.mainCategory = new RegExp(category, "i");
    const listings = await BidListing.find(q).sort({ createdAt:-1 }).limit(100);
    res.json({ success:true, listings });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

module.exports = router;
