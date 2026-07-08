import api from './api';

export const jobService = {
  async list(params = {}) {
    const { data } = await api.get('/jobs', { params });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/jobs', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/jobs/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/jobs/${id}`);
    return data;
  },
};
