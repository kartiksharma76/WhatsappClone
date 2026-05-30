import { create } from 'zustand'

export const useCallStore = create((set, get) => ({
  activeCall: null,         // { callerId, targetUserId, isVideo, isIncoming, callerName, callerAvatar }
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,
  isVideoOff: false,
  callStatus: 'IDLE',       // IDLE | RINGING | ONGOING

  setCallState: (updates) => set((state) => ({ ...state, ...updates })),

  resetCall: () => {
    const { localStream, remoteStream, peerConnection } = get()
    
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop())
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(t => t.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    
    set({
      activeCall: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isVideoOff: false,
      callStatus: 'IDLE'
    })
  },

  toggleMute: () => {
    const { localStream, isMuted } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach(t => {
        t.enabled = isMuted // If it was muted (true), we enable it (t.enabled = true), so now it's not muted
      })
      set({ isMuted: !isMuted })
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach(t => {
        t.enabled = isVideoOff
      })
      set({ isVideoOff: !isVideoOff })
    }
  }
}))
