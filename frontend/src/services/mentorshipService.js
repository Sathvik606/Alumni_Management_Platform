import api from './api';

export const mentorshipService = {
  async requestSession(payload) {
    const { data } = await api.post('/mentorship', payload);
    return data;
  },
  async listSessions() {
    const { data } = await api.get('/mentorship/sessions');
    return data;
  },
  async updateSession(id, status, meetingLink = '') {
    const { data } = await api.put(`/mentorship/${id}`, { status, meetingLink });
    return data;
  },
};
