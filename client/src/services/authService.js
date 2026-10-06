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
