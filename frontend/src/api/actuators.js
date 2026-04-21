import api from './axios';

export const getActuatorLogs = (plotID, limit = 20, offset = 0) =>
  api.get(`/plots/${plotID}/actuators`, { params: { limit, offset } }).then(r => r.data);

export const getLatestActuator = (plotID) =>
  api.get(`/plots/${plotID}/actuators/latest`).then(r => r.data);

export const manualOverride = (plotID, data) =>
  api.post(`/plots/${plotID}/actuators/manual`, data).then(r => r.data);
