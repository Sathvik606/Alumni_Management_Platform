import api from './api';

export const alumniService = {
  async list(params = {}) {
    const { data } = await api.get('/alumni', { params });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/alumni/${id}`);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/alumni/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/alumni/${id}`);
    return data;
  },
  async me() {
    const { data } = await api.get('/alumni/profile/me');
    return data;
  },
};
