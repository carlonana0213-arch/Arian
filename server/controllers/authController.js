const bcrypt = require("bcryptjs");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const AuditLog = require("../models/AuditLog");
const createAuditLog = require("../utils/createAuditLog");
//register
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "First name, last name, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "artist",
    });

    const token = generateToken(user._id);

    await createAuditLog({
      userId: user._id,
      action: "LOGIN_SUCCESS",
      details: "Successful account login.",
      req,
    });

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Failed to register user.",
    });
  }
};

//login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is inactive.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    await createAuditLog({
      userId: user._id,
      action: "LOGIN_SUCCESS",
      details: "Successful account login.",
      req,
    });

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Failed to login.",
    });
  }
};

//get user
const getMe = async (req, res) => {
  res.json({
    user: req.user,
  });
};

const updateMyProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, about, department } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({
        message: "First name and last name are required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "That email address is already in use.",
      });
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = normalizedEmail;
    user.about = about?.trim() || "";
    user.department = department?.trim() || "";

    await user.save();

    await createAuditLog({
      userId: user._id,
      action: "PROFILE_UPDATED",
      details: "Updated profile information.",
      req,
    });

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
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
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Failed to update profile.",
    });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.status(400).json({
        message: "New password must be different from your current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    await createAuditLog({
      userId: user._id,
      action: "PASSWORD_CHANGED",
      details: "Account password was changed.",
      req,
    });

    res.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      message: "Failed to change password.",
    });
  }
};

const getMyAuditLogs = async (req, res) => {
  try {
    const AuditLog = require("../models/AuditLog");

    const logs = await AuditLog.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      logs,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    res.status(500).json({
      message: "Failed to retrieve audit logs.",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMyProfile,
  changeMyPassword,
  getMyAuditLogs,
};
