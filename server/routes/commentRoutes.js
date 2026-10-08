const express = require("express");

const {
  createComment,
  getAssetComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/asset/:assetId",
  protect,
  authorize("admin", "manager", "client", "artist"),
  createComment,
);

router.get("/asset/:assetId", protect, getAssetComments);

router.patch("/:id", protect, updateComment);

router.delete("/:id", protect, deleteComment);

module.exports = router;
