import api from "./api";

export const getTasksByAssetId = async (assetId) => {
  const response = await api.get(`/tasks/asset/${assetId}`);

  return response.data.tasks;
};

export const createTask = async (assetId, taskData) => {
  const response = await api.post(`/tasks`, {
    assetId,
    ...taskData,
  });

  return response.data.task;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.patch(`/tasks/${taskId}`, taskData);

  return response.data.task;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);

  return response.data.message;
};
