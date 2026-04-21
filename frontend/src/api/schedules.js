import api from './axios';

export const getSchedulesByPlot = (plotID) =>
  api.get(`/plots/${plotID}/schedules`).then(r => r.data);

export const getScheduleByID = (id) =>
  api.get(`/schedules/${id}`).then(r => r.data);

export const createSchedule = (plotID, data) =>
  api.post(`/plots/${plotID}/schedules`, data).then(r => r.data);

export const updateSchedule = (id, data) =>
  api.put(`/schedules/${id}`, data).then(r => r.data);

export const deleteSchedule = (id) =>
  api.delete(`/schedules/${id}`).then(r => r.data);
