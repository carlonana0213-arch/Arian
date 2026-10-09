const User = require("../models/User");
const createAuditLog = require("../utils/createAuditLog");

//get (all)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to retrieve users.",
    });
  }
};

//get (id)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Failed to retrieve user.",
    });
  }
};

//update
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, about, department, role, isActive } =
      req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      about: user.about,
      department: user.department,
      role: user.role,
      isActive: user.isActive,
    };

    // Validate names
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return res.status(400).json({
          message: "First name cannot be empty.",
        });
      }

      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return res.status(400).json({
          message: "Last name cannot be empty.",
        });
      }

      user.lastName = lastName.trim();
    }

    // Validate email
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          message: "Email cannot be empty.",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "That email address is already in use.",
        });
      }

      user.email = normalizedEmail;
    }

    // Optional profile information
    if (about !== undefined) {
      user.about = about.trim();
    }

    if (department !== undefined) {
      user.department = department.trim();
    }

    // Validate role
    if (role !== undefined) {
      const allowedRoles = ["admin", "manager", "artist", "client"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid user role.",
        });
      }

      user.role = role;
    }

    // Account status
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be a boolean.",
        });
      }

      user.isActive = isActive;
    }

    await user.save();

    const changedFields = [];

    if (oldValues.firstName !== user.firstName) {
      changedFields.push("first name");
    }

    if (oldValues.lastName !== user.lastName) {
      changedFields.push("last name");
    }

    if (oldValues.email !== user.email) {
      changedFields.push("email");
    }

    if (oldValues.about !== user.about) {
      changedFields.push("about");
    }

    if (oldValues.department !== user.department) {
      changedFields.push("department");
    }

    if (oldValues.role !== user.role) {
      changedFields.push("role");
    }

    if (oldValues.isActive !== user.isActive) {
      changedFields.push("account status");
    }

    await createAuditLog({
      userId: req.user._id,
      action: "USER_UPDATED",
      details: `Updated ${user.firstName} ${user.lastName}${
        changedFields.length ? `: ${changedFields.join(", ")}.` : "."
      }`,
      req,
    });

    res.json({
      message: "User updated successfully.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        about: user.about,
        department: user.department,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "That email address is already in use.",
      });
    }

    res.status(500).json({
      message: "Failed to update user.",
    });
  }
};

//delete
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    await user.deleteOne();

    res.json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user.",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
