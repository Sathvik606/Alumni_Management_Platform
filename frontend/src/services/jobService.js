import api from './api';

export const jobService = {
  async list(params = {}) {
    const { data } = await api.get('/jobs', { params });
    return data;
  },
};
