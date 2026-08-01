import api from './api';

export const referralService = {
  async submit(payload) {
    const { data } = await api.post('/referrals', payload);
    return data;
  },
  async listMyRequests() {
    const { data } = await api.get('/referrals/my-requests');
    return data;
  },
  async listForMe() {
    const { data } = await api.get('/referrals/for-me');
    return data;
  },
  async updateStatus(id, status, notes = '') {
    const { data } = await api.put(`/referrals/${id}`, { status, notes });
    return data;
  },
};
