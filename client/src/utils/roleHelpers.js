export const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Administrator";

    case "manager":
      return "Project Manager";

    case "artist":
      return "Artist / Animator";

    case "client":
      return "Reviewer / Client";

    default:
      return role || "User";
  }
};

export const isAdmin = (role) => role === "admin";

export const isManager = (role) => role === "manager" || role === "admin";

export const isArtist = (role) => role === "artist";

export const isClient = (role) => role === "client";
