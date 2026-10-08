import api from "./api";

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
};

export const updateMyProfile = async (profileData) => {
  const response = await api.patch("/auth/me", profileData);

  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

export const changeMyPassword = async (passwordData) => {
  const response = await api.patch("/auth/me/password", passwordData);

  return response.data;
};

export const getMyAuditLogs = async () => {
  const response = await api.get("/auth/me/audit-logs");

  return response.data;
};
