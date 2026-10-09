const Project = require("../models/Project");
const User = require("../models/User");
const createAuditLog = require("../utils/createAuditLog");
const createNotifications = require("../utils/createNotification");
const getProjectRecipients = require("../utils/getProjectRecipients");
//create
const createProject = async (req, res) => {
  try {
    const { name, description, client, startDate, deadline, priority, status, members } =
      req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required.",
      });
    }

    let clientUser = null;

    if (client) {
      clientUser = await User.findById(client);

      if (!clientUser) {
        return res.status(404).json({
          message: "Selected client not found.",
        });
      }

      if (clientUser.role !== "client") {
        return res.status(400).json({
          message: "Selected user is not a client.",
        });
      }
    }

    const projectMembers = [
      {
        user: req.user._id,
        role: "manager",
      },
    ];

    if (Array.isArray(members)) {
      members.forEach((member) => {
        if (
          member?.user &&
          ["artist", "manager", "client"].includes(member.role) &&
          member.user.toString() !== req.user._id.toString()
        ) {
          projectMembers.push({
            user: member.user,
            role: member.role,
          });
        }
      });
    }

    const project = await Project.create({
      name,
      description,
      manager: req.user._id,
      client: clientUser?._id || undefined,
      startDate,
      deadline,
      priority: priority || "Normal",
      status: status || "planning",
      members: projectMembers,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    await createNotifications({
      recipientIds: getProjectRecipients(project),
      projectId: project._id,
      actorId: req.user._id,
      type: "project_added",
      message: `You were added to project "${project.name}".`,
    });

    await createAuditLog({
      userId: req.user._id,
      action: "PROJECT_CREATED",
      details: `Created project "${project.name}".`,
      req,
    });

    res.status(201).json({
      message: "Project created successfully.",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project.",
    });
  }
};

//get all
const getProjects = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      filter = {
        $or: [
          { manager: req.user._id },
          { client: req.user._id },
          {
            "members.user": req.user._id,
          },
        ],
      };
    }

    const projects = await Project.find(filter)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to retrieve projects.",
    });
  }
};

//get
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const hasAccess =
      req.user.role === "admin" ||
      project.manager?._id.toString() === req.user._id.toString() ||
      project.client?._id?.toString() === req.user._id.toString() ||
      project.members.some(
        (member) => member.user?._id.toString() === req.user._id.toString(),
      );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have access to this project.",
      });
    }

    res.json({
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to retrieve project.",
    });
  }
};

//update
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can update this project.",
      });
    }

    const { name, description, client, startDate, deadline, priority, status, members } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (client !== undefined) updateData.client = client;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (members !== undefined) updateData.members = members;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    await createAuditLog({
      userId: req.user._id,
      action: "PROJECT_UPDATED",
      details: `Updated project "${updatedProject.name}".`,
      req,
    });

    await createNotifications({
      recipientIds: getProjectRecipients({
        manager: updatedProject.manager?._id,
        client: updatedProject.client?._id,
        members: updatedProject.members.map((m) => ({ user: m.user?._id })),
      }),
      projectId: updatedProject._id,
      actorId: req.user._id,
      type: "project_updated",
      message: `Project "${updatedProject.name}" was updated.`,
    });

    res.json({
      message: "Project updated successfully.",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      message: "Failed to update project.",
      error: error.message,
    });
  }
};

//delete
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can delete this project.",
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "PROJECT_DELETED",
      details: `Deleted project "${project.name}".`,
      req,
    });

    await createNotifications({
      recipientIds: getProjectRecipients(project),
      projectId: project._id,
      actorId: req.user._id,
      type: "project_updated",
      message: `Project "${project.name}" was deleted.`,
    });

    await project.deleteOne();

    res.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      message: "Failed to delete project.",
    });
  }
};

//add
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        message: "userId and role are required.",
      });
    }

    if (!["artist", "manager", "client"].includes(role)) {
      return res.status(400).json({
        message: "Invalid project member role.",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can add members.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const alreadyMember = project.members.some(
      (member) => member.user.toString() === userId,
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "User is already a member of this project.",
      });
    }

    project.members.push({
      user: userId,
      role,
    });

    await project.save();
    await createNotifications({
      recipientIds: [userId],
      projectId: project._id,
      actorId: req.user._id,
      type: "project_added",
      message: `You were added to project "${project.name}" as ${role}.`,
    });

    await createAuditLog({
      userId: req.user._id,
      action: "MEMBER_ADDED",
      details: `Added ${user.firstName} ${user.lastName} to project "${project.name}" as ${role}.`,
      req,
    });

    const updatedProject = await Project.findById(project._id)
      .populate("manager", "firstName lastName email role")
      .populate("client", "firstName lastName email role")
      .populate("members.user", "firstName lastName email role");

    res.status(201).json({
      message: "Member added successfully.",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Add member error:", error);

    res.status(500).json({
      message: "Failed to add project member.",
    });
  }
};

//remove
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isManager) {
      return res.status(403).json({
        message: "Only the project manager can remove members.",
      });
    }

    const removedUser = await User.findById(req.params.userId);

    if (!removedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const wasMember = project.members.some(
      (member) => member.user.toString() === req.params.userId,
    );

    if (!wasMember) {
      return res.status(404).json({
        message: "User is not a member of this project.",
      });
    }

    project.members = project.members.filter(
      (member) => member.user.toString() !== req.params.userId,
    );

    await project.save();

    await createAuditLog({
      userId: req.user._id,
      action: "MEMBER_REMOVED",
      details: `Removed ${removedUser.firstName} ${removedUser.lastName} from project "${project.name}".`,
      req,
    });

    await createNotifications({
      recipientIds: [req.params.userId],
      projectId: project._id,
      actorId: req.user._id,
      type: "member_removed",
      message: `You were removed from project "${project.name}".`,
    });

    res.json({
      message: "Member removed successfully.",
    });
  } catch (error) {
    console.error("Remove member error:", error);

    res.status(500).json({
      message: "Failed to remove project member.",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};