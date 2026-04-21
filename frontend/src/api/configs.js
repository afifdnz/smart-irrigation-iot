import api from './axios';

export const getConfigByPlot = (plotID) =>
  api.get(`/plots/${plotID}/config`).then(r => r.data);

export const createConfig = (plotID, data) =>
  api.post(`/plots/${plotID}/config`, data).then(r => r.data);

export const updateConfig = (plotID, data) =>
  api.put(`/plots/${plotID}/config`, data).then(r => r.data);
