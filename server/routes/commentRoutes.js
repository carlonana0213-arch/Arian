const express = require("express");

const {
  createComment,
  getAssetComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/asset/:assetId", protect, createComment);

router.get("/asset/:assetId", protect, getAssetComments);

router.patch("/:id", protect, updateComment);

router.delete("/:id", protect, deleteComment);

module.exports = router;
