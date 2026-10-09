import api from "./api";

export const getAdminAuditLogs = async ({
  page = 1,
  user = "",
  action = "",
} = {}) => {
  const params = new URLSearchParams();

  params.set("page", page);
  params.set("limit", 10);

  if (user) {
    params.set("user", user);
  }

  if (action) {
    params.set("action", action);
  }

  const response = await api.get(`/admin/audit-logs?${params.toString()}`);

  return response.data;
};

export const getAuditActions = async () => {
  const response = await api.get("/admin/audit-actions");

  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");

  return response.data;
};

export const updateAdminUser = async (userId, userData) => {
  const response = await api.patch(`/users/${userId}`, userData);

  return response.data;
};
