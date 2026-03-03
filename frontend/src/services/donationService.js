import api from './api';

export const donationService = {
  async create(payload) {
    const { data } = await api.post('/donations', payload);
    return data;
  },
  async list(role = 'alumni') {
    const endpoint = role === 'admin' ? '/donations' : '/donations/my';
    const { data } = await api.get(endpoint);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/donations/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/donations/${id}`);
    return data;
  },
  async stats() {
    const { data } = await api.get('/donations/stats');
    return data;
  },
};
