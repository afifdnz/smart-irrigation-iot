import api from './axios';

export const getTanks = () => api.get('/tanks').then(r => r.data);
export const getTanksByID = (id) => api.get(`/tanks/${id}`).then(r => r.data);
export const createTank = (data) => api.post('/tanks', data).then(r => r.data);
export const updateTank = (id, data) => api.put(`/tanks/${id}`, data).then(r => r.data);
export const deleteTank = (id) => api.delete(`/tanks/${id}`).then(r => r.data);
