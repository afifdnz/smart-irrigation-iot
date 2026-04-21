import api from './axios';

export const getWaterLevels = (tankID, limit = 20, offset = 0) =>
  api.get(`/tanks/${tankID}/levels`, { params: { limit, offset } }).then(r => r.data);

export const getLatestWaterLevel = (tankID) =>
  api.get(`/tanks/${tankID}/levels/latest`).then(r => r.data);
