const Notification = require("../models/Notification");

const createNotifications = async ({
  recipientIds,
  projectId,
  actorId,
  type,
  message,
}) => {
  try {
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return;
    }

    const uniqueRecipientIds = [
      ...new Set(recipientIds.map((id) => id.toString())),
    ].filter((id) => id !== actorId.toString());

    if (uniqueRecipientIds.length === 0) {
      return;
    }

    await Notification.insertMany(
      uniqueRecipientIds.map((recipientId) => ({
        recipient: recipientId,
        project: projectId,
        actor: actorId,
        type,
        message,
      })),
    );
  } catch (error) {
    console.error("Notification creation error:", error);
  }
};

module.exports = createNotifications;
