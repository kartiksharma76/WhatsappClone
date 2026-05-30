import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { statusAPI } from '../services/api'
import { authAPI } from '../services/api'

// ─── Auth store (persisted) ──────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      lockPin:      null,
      isLocked:     false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      setLockPin: (pin) =>
        set({ lockPin: pin }),

      setIsLocked: (locked) =>
        set({ isLocked: locked }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isLocked: false }),
    }),
    {
      name: 'chatapp-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// ─── Chat store ──────────────────────────────────────────────────────────────
export const useChatStore = create((set, get) => ({
  chats:          [],
  activeChatId:   null,
  messages:       {},   // { [chatId]: Message[] }
  typingUsers:    {},   // { [chatId]: { [userId]: userName } }
  searchQuery:    '',
  isLoading:      false,

  setChats:       (chats)      => set({ chats }),

  updateChat: (updatedChat) =>
    set((state) => ({
      chats: state.chats.map(c => c.id === updatedChat.id ? updatedChat : c)
    })),

  setActiveChat:  (chatId)     => set({ activeChatId: chatId }),

  updateChatPresence: (userId, status, lastSeen) =>
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.chatType === 'PRIVATE' && c.participants?.some(p => p.id === userId)) {
          return { ...c, status, lastSeen }
        }
        return c
      })
    })),

  setMessages: (chatId, messages) =>
    set((state) => ({ messages: { ...state.messages, [chatId]: messages } })),

  prependMessages: (chatId, olderMessages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...olderMessages, ...(state.messages[chatId] || [])]
      }
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      console.log(`[Store] addMessage called for message id: ${message.id}`);
      const currentMessages = state.messages[chatId] || [];
      // Aggressively deduplicate by filtering out any message with the same ID
      const filteredMessages = currentMessages.filter(m => String(m.id) !== String(message.id));
      
      return {
        messages: {
          ...state.messages,
          [chatId]: [...filteredMessages, message]
        },
        // Bump chat to top and update last message
        chats: state.chats
          .map(c => c.id === chatId
            ? { ...c, lastMessage: message, updatedAt: message.createdAt }
            : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      };
    }),

  updateMessage: (chatId, updatedMsg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map(m =>
          m.id === updatedMsg.id ? updatedMsg : m
        )
      }
    })),

  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map(m =>
          m.id === messageId ? { ...m, isDeleted: true, content: null, fileUrl: null, fileName: null, fileSize: null, fileMimeType: null, thumbnailUrl: null, mediaDuration: null } : m
        )
      }
    })),

  setTyping: (chatId, userId, userName, isTyping) =>
    set((state) => {
      const chatTyping = { ...(state.typingUsers[chatId] || {}) }
      if (isTyping) chatTyping[userId] = userName
      else delete chatTyping[userId]
      return { typingUsers: { ...state.typingUsers, [chatId]: chatTyping } }
    }),

  incrementUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      )
    })),

  resetUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      )
    })),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading:     (v) => set({ isLoading: v }),
  drafts:         {},
  setDraft:       (chatId, text) => set((state) => ({ drafts: { ...state.drafts, [chatId]: text } })),
}))

// ─── UI / theme store ────────────────────────────────────────────────────────
export const useUIStore = create(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () => set((state) => {
        const next = !state.darkMode
        document.documentElement.classList.toggle('dark', next)
        return { darkMode: next }
      }),
      initTheme: () => {
        const saved = JSON.parse(localStorage.getItem('chatapp-ui') || '{}')
        if (saved?.state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    }),
    { name: 'chatapp-ui' }
  )
)

// ─── Status store ───────────────────────────────────────────────────────────
export const useStatusStore = create((set, get) => ({
  statuses: [],
  isLoading: false,
  fetchStatuses: async () => {
    set({ isLoading: true })
    try {
      const { data } = await statusAPI.getActiveStatuses()
      set({ statuses: data.data || [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
  createStatus: async (formData) => {
    const { data } = await statusAPI.createStatus(formData)
    set((state) => ({ statuses: [data.data, ...state.statuses] }))
  },
  markAsViewed: async (statusId) => {
    await statusAPI.markAsViewed(statusId)
    set((state) => ({
      statuses: state.statuses.map(s => s.id === statusId ? { ...s, viewed: true } : s)
    }))
  },
  deleteStatus: async (statusId) => {
    await statusAPI.deleteStatus(statusId)
    set((state) => ({
      statuses: state.statuses.filter(s => s.id !== statusId)
    }))
  },
  handleStatusWSMessage: (message) => {
    const { action, statusId, status, userId, viewer } = message
    const currentStatuses = get().statuses

    if (action === 'CREATE') {
      if (!currentStatuses.some((s) => s.id === status.id)) {
        set({ statuses: [status, ...currentStatuses] })
      }
    } else if (action === 'DELETE') {
      set({ statuses: currentStatuses.filter((s) => s.id !== statusId) })
    } else if (action === 'VIEW') {
      set({
        statuses: currentStatuses.map((s) => {
          if (s.id === statusId) {
            const viewedBy = s.viewedBy || []
            if (!viewedBy.some((v) => v.id === viewer.id)) {
              return { ...s, viewedBy: [...viewedBy, viewer] }
            }
          }
          return s
        })
      })
    }
  }
}))

// ─── Call store ───────────────────────────────────────────────────────────
export const useCallStore = create((set, get) => ({
  activeCall: null,
  callStatus: 'IDLE', // IDLE, RINGING, ONGOING
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  peerConnection: null,
  setCallState: (newState) => set(newState),
  resetCall: () => {
    const { localStream, peerConnection } = get()
    if (localStream) localStream.getTracks().forEach(t => t.stop())
    if (peerConnection) peerConnection.close()
    set({
      activeCall: null,
      callStatus: 'IDLE',
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      peerConnection: null
    })
  },
  toggleMute: () => set((state) => {
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(t => t.enabled = state.isMuted)
    }
    return { isMuted: !state.isMuted }
  }),
  toggleVideo: () => set((state) => {
    if (state.localStream) {
      state.localStream.getVideoTracks().forEach(t => t.enabled = state.isVideoOff)
    }
    return { isVideoOff: !state.isVideoOff }
  })
}))
