const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    assetType: {
      type: String,
      enum: ["image", "design", "document", "video", "other"],
      default: "image",
    },

    currentVersion: {
      type: Number,
      default: 1,
    },

    versions: [
      {
        versionNumber: {
          type: Number,
          required: true,
        },

        fileUrl: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },

        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },

        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },

        reviewComment: {
          type: String,
          default: "",
        },

        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        reviewedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Asset", assetSchema);
