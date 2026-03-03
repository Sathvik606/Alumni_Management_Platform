import api from './api';

export const eventService = {
  async list() {
    const { data } = await api.get('/events');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/events', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/events/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/events/${id}`);
    return data;
  },
  async rsvp(id) {
    const { data } = await api.post(`/events/${id}/rsvp`);
    return data;
  },
  async unrsvp(id) {
    const { data } = await api.post(`/events/${id}/unrsvp`);
    return data;
  },
};
