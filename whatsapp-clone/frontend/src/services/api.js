import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from sessionStorage on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = sessionStorage.getItem('refreshToken')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh })
        sessionStorage.setItem('accessToken', data.data.accessToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)         => api.post('/auth/register', data),
  login:          (data)         => api.post('/auth/login', data),
  logout:         ()             => api.post('/auth/logout'),
  changePassword: (data)         => api.put('/auth/change-password', data),
}

// ─── Users ──────────────────────────────────────────────────────────────────
export const userAPI = {
  getMe:                () => api.get('/users/me'),
  updateProfile:        (data) => api.put('/users/me', null, { params: data }),
  updatePicture:        (formData) => api.put('/users/me/picture', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        }),
  toggleReadReceipts:   (enabled) => api.put('/users/me/settings/read-receipts', null, { params: { enabled } }),
  searchUsers:          (q, page=0) => api.get(`/users/search`, { params: { q, page, size: 20 } }),
  getUserById:          (id) => api.get(`/users/${id}`),
  blockUser:            (id) => api.post(`/users/block/${id}`),
  unblockUser:          (id) => api.delete(`/users/block/${id}`),
  deleteAccount:        () => api.delete('/users/me'),
}

// ─── Chats ──────────────────────────────────────────────────────────────────
export const chatAPI = {
  getUserChats:      (page = 0)    => api.get('/chats', { params: { page, size: 20, sort: 'updatedAt,desc' } }),
  getChat:           (id)          => api.get(`/chats/${id}`),
  createPrivate:     (recipientId) => api.post('/chats/private', { recipientId }),
  createGroup:       (data)        => api.post('/chats/group', data),
  searchChats:       (q)           => api.get('/chats/search', { params: { q } }),
  updateGroup:       (id, data)    => api.put(`/chats/${id}/group`, data),
  updateGroupIcon:   (id, form)    => api.put(`/chats/${id}/group/icon`, form, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      }),
  addParticipants:   (id, data)    => api.post(`/chats/${id}/participants`, data),
  removeParticipant: (id, uid)     => api.delete(`/chats/${id}/participants/${uid}`),
  makeAdmin:         (id, uid)     => api.post(`/chats/${id}/admins/${uid}`),
  removeAdmin:       (id, uid)     => api.delete(`/chats/${id}/admins/${uid}`),
  leaveGroup:        (id)          => api.post(`/chats/${id}/leave`),
  deleteChat:        (id)          => api.delete(`/chats/${id}`),
  clearChat:         (id)          => api.delete(`/chats/${id}/clear`),
  pinChat:           (id, pinned)  => api.put(`/chats/${id}/pin`, null, { params: { pinned } }),
  archiveChat:       (id, archived)=> api.put(`/chats/${id}/archive`, null, { params: { archived } }),
  muteChat:          (id, muted)   => api.put(`/chats/${id}/mute`, null, { params: { muted } }),
  setDisappearingTimer:(id, timerHours) => api.put(`/chats/${id}/disappearing-timer`, null, { params: { timerHours } }),
  updateGroupInfo:   (id, data)    => api.put(`/chats/${id}/group`, data),
  addGroupParticipants:(id, data) => api.post(`/chats/${id}/participants`, data),
  removeGroupParticipant:(chatId, userId) => api.delete(`/chats/${chatId}/participants/${userId}`),
  generateInviteToken: (id)        => api.post(`/chats/${id}/invite-token`),
  joinWithInviteToken: (token)     => api.post(`/chats/join/${token}`),
  getOrCreateAiChat:   ()          => api.post('/chats/ai'),
}

// ─── Messages ────────────────────────────────────────────────────────────────
export const messageAPI = {
  sendMessage:    (data)           => api.post('/messages', data),
  sendFile:       (chatId, form)   => api.post('/messages/file', form, {
                                       params: { chatId },
                                       headers: { 'Content-Type': 'multipart/form-data' }
                                     }),
  getMessages:       (chatId, page=0) => api.get(`/messages/chat/${chatId}?page=${page}`),
  getMediaMessages:  (chatId, page=0) => api.get(`/messages/chat/${chatId}/media?page=${page}`),
  searchMessages:    (chatId, q)  => api.get(`/messages/chat/${chatId}/search`, { params: { q } }),
  editMessage:       (data)       => api.put(`/messages/edit`, data),
  deleteMessage:     (id, forEveryone=false) => api.delete(`/messages/${id}`, { params: { deleteForEveryone: forEveryone } }),
  reactToMessage:    (data)       => api.post(`/messages/react`, data),
  removeReaction:    (id)         => api.delete(`/messages/${id}/react`),
  markSeen:          (chatId)     => api.post(`/messages/chat/${chatId}/seen`),
  starMessage:       (id)         => api.post(`/messages/${id}/star`),
  unstarMessage:     (id)         => api.delete(`/messages/${id}/star`),
  getStarred:        (page=0)     => api.get(`/messages/starred`, { params: { page, size: 30 } }),
  getMessageInfo:    (id)         => api.get(`/messages/${id}/info`),
  forwardMessage:    (msgId, chatIds) => api.post('/messages/forward', null, { params: { messageId: msgId, chatIds: chatIds.join(',') } }),
  exportChat:        (chatId)     => api.get(`/messages/chat/${chatId}/export`, { responseType: 'blob' }),
  broadcastMessage:  (data)       => api.post('/messages/broadcast', data),
}

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:       (page = 0) => api.get('/notifications', { params: { page, size: 20 } }),
  getUnread:    ()          => api.get('/notifications/unread-count'),
  markAllRead:  ()          => api.put('/notifications/read-all'),
  deleteOne:    (id)        => api.delete(`/notifications/${id}`),
}
// ─── Status ──────────────────────────────────────────────────────────────────
export const statusAPI = {
  createStatus: (data) => api.post('/status', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getActiveStatuses: () => api.get('/status'),
  markAsViewed: (statusId) => api.post(`/status/${statusId}/view`),
  deleteStatus: (statusId) => api.delete(`/status/${statusId}`)
}

export default api
