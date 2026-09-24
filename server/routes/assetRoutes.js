const express = require("express");

const {
  createAsset,
  getProjectAssets,
  getAssetById,
  updateAsset,
  uploadNewVersion,
  approveVersion,
  rejectVersion,
  deleteAsset,
  getProjectProgress,
} = require("../controllers/assetController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ========================================
// PROJECT ASSETS
// ========================================

router.post(
  "/project/:projectId",
  protect,
  authorize("admin", "manager", "artist"),
  upload.single("image"),
  createAsset,
);

router.get("/project/:projectId", protect, getProjectAssets);

// ========================================
// PROJECT PROGRESS
// ========================================

router.get("/project/:projectId/progress", protect, getProjectProgress);

// ========================================
// SINGLE ASSET
// ========================================

router.get("/:id", protect, getAssetById);

router.patch("/:id", protect, authorize("admin", "manager"), updateAsset);

router.delete("/:id", protect, authorize("admin", "manager"), deleteAsset);

// ========================================
// ASSET VERSIONS
// ========================================

router.post(
  "/:id/versions",
  protect,
  authorize("admin", "manager", "artist"),
  upload.single("image"),
  uploadNewVersion,
);

router.patch(
  "/:id/versions/:versionNumber/approve",
  protect,
  authorize("admin", "manager"),
  approveVersion,
);

router.patch(
  "/:id/versions/:versionNumber/reject",
  protect,
  authorize("admin", "manager"),
  rejectVersion,
);

module.exports = router;
