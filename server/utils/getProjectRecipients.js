const getProjectRecipients = (project) => {
  const recipientIds = [];

  if (project.manager) {
    recipientIds.push(project.manager);
  }

  if (project.client) {
    recipientIds.push(project.client);
  }

  if (Array.isArray(project.members)) {
    project.members.forEach((member) => {
      if (member.user) {
        recipientIds.push(member.user);
      }
    });
  }

  return [...new Set(recipientIds.map((id) => id.toString()))];
};

module.exports = getProjectRecipients;
