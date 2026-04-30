const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const upload = require("../config/multer");

router.post("/rental-partner", communityController.createRentalPartner);
router.get("/rental-partners", communityController.getRentalPartners);
router.post("/buyer-posts", upload.array("media", 4), communityController.createBuyerPost);
router.get("/buyer-posts", communityController.getBuyerPosts);
router.post("/buyer-posts/:id/comment", communityController.addBuyerPostComment);
router.post("/buyer-posts/:id/like", communityController.toggleBuyerPostLike);

// Admin delete routes
router.delete("/admin/rental-partner/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    await mongoose.connection.db.collection("rentalpartners").deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});
router.delete("/admin/buyer-post/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    await mongoose.connection.db.collection("buyerposts").deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
