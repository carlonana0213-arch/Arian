export const getProjectStatusLabel = (status) => {
  switch (status) {
    case "planning":
      return "Planning";

    case "active":
      return "In Production";

    case "completed":
      return "Completed";

    case "archived":
      return "Archived";

    default:
      return status || "Unknown";
  }
};

export const getProjectStatusValue = (label) => {
  switch (label) {
    case "Planning":
      return "planning";

    case "In Production":
      return "active";

    case "Completed":
      return "completed";

    case "Archived":
      return "archived";

    default:
      return "planning";
  }
};
