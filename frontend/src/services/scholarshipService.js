import api from './api';

export const scholarshipService = {
  async createRequest(payload) {
    const { data } = await api.post('/scholarships', payload);
    return data;
  },
  async listAll() {
    const { data } = await api.get('/scholarships');
    return data;
  },
  async listMyRequests() {
    const { data } = await api.get('/scholarships/my-requests');
    return data;
  },
  async fundRequest(id, amount) {
    const { data } = await api.put(`/scholarships/${id}/fund`, { amount });
    return data;
  },
};
