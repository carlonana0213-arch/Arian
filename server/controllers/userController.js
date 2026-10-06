const User = require("../models/User");

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
    const { firstName, lastName, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (firstName !== undefined) {
      user.firstName = firstName;
    }

    if (lastName !== undefined) {
      user.lastName = lastName;
    }

    if (email !== undefined) {
      user.email = email.toLowerCase();
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    res.json({
      message: "User updated successfully.",
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
    console.error("Update user error:", error);

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
