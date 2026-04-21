import api from './axios';

export const getSensorReadings = (plotID, limit = 20, offset = 0) => api.get(`plots/${plotID}/sensors`, { limit, offset }).then(r => r.data);
export const getLatestSensor = (plotID) => api.get(`/plots/${plotID}/sensors/latest`).then(r => r.data);
