const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "project_added",
        "project_updated",
        "project_deleted",

        "member_added",
        "member_removed",

        "asset_created",
        "asset_updated",
        "asset_deleted",
        "version_uploaded",
        "asset_approved",
        "asset_rejected",

        "revision_requested",
        "feedback_posted",
        "feedback_updated",
        "feedback_deleted",

        "task_created",
        "task_updated",
        "task_completed",
        "task_reopened",
        "task_deleted",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
