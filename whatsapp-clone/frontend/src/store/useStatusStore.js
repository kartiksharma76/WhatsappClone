import { create } from 'zustand'
import { statusAPI } from '../services/api'

export const useStatusStore = create((set, get) => ({
  statuses: [],
  isLoading: false,

  fetchStatuses: async () => {
    set({ isLoading: true })
    try {
      const res = await statusAPI.getActiveStatuses()
      set({ statuses: res.data.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch statuses', error)
    }
  },

  createStatus: async (data) => {
    try {
      const res = await statusAPI.createStatus(data)
      set((state) => ({ statuses: [res.data.data, ...state.statuses] }))
      return res.data.data
    } catch (error) {
      throw error
    }
  },

  markAsViewed: async (statusId) => {
    try {
      await statusAPI.markAsViewed(statusId)
      set((state) => ({
        statuses: state.statuses.map((s) =>
          s.id === statusId ? { ...s, viewed: true } : s
        ),
      }))
    } catch (error) {
      console.error('Failed to mark status viewed', error)
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await statusAPI.deleteStatus(statusId)
      set((state) => ({
        statuses: state.statuses.filter((s) => s.id !== statusId),
      }))
    } catch (error) {
      throw error
    }
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
        }),
      })
    }
  }
}))
