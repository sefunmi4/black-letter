import { request } from './client';

export const Quest = {
  list: () => request('/api/quests'),
  create: (data) => request('/api/quests', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/api/quests/${id}`),
  update: (id, data) => request(`/api/quests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/api/quests/${id}`, { method: 'DELETE' })
};

export const Guild = {
  list: () => request('/api/guilds'),
  create: (data) => request('/api/guilds', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/api/guilds/${id}`),
  update: (id, data) => request(`/api/guilds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/api/guilds/${id}`, { method: 'DELETE' })
};

export const QuestLog = {
  list: () => request('/api/quest_logs'),
  create: (data) => request('/api/quest_logs', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/api/quest_logs/${id}`),
  update: (id, data) => request(`/api/quest_logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/api/quest_logs/${id}`, { method: 'DELETE' })
};
