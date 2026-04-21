import api from './axios';

export const getPlots = () => api.get('/plots').then(r => r.data);
export const getPlotByID = (id) => api.get(`/plots/${id}`).then(r => r.data);
export const createPlot = (data) => api.post('/plots', data).then(r => r.data);
export const updatePlot = (id, data) => api.put(`/plots/${id}`, data).then(r => r.data);
export const deactivatePlot = (id) => api.delte(`/plots/${id}`).then(r => r.data);


