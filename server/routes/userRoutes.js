const express = require("express");

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Added "artist" to the authorize middleware so they can populate the co-artist dropdown
router.get("/", protect, authorize("admin", "manager", "artist"), getUsers);

router.get("/:id", protect, authorize("admin", "manager", "artist"), getUserById);

router.patch("/:id", protect, authorize("admin"), updateUser);

router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;