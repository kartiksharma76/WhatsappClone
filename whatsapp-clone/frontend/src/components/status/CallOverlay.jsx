import { useEffect, useRef } from 'react'
import { useCallStore, useAuthStore, useUIStore } from '../../store'
import { sendCallSignal } from '../../services/websocket'
import { toast } from 'react-toastify'

// Use global RTCPeerConnection configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

export default function CallOverlay() {
  const { user } = useAuthStore()
  const { 
    activeCall, callStatus, localStream, remoteStream, 
    isMuted, isVideoOff, setCallState, resetCall, peerConnection
  } = useCallStore()
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const iceCandidatesQueue = useRef([])

  // Listen to calling signals forwarded by ChatPage's WebSocket connection
  useEffect(() => {
    const handleSignalEvent = (e) => {
      handleSignal(e.detail)
    }
    document.addEventListener('CALL_SIGNAL_RECEIVED', handleSignalEvent)
    return () => {
      document.removeEventListener('CALL_SIGNAL_RECEIVED', handleSignalEvent)
    }
  }, [])

  // Cleanup queue when IDLE
  useEffect(() => {
    if (callStatus === 'IDLE') {
      iceCandidatesQueue.current = []
    }
  }, [callStatus])

  // Multi-tab synchronization using BroadcastChannel
  useEffect(() => {
    let channel
    try {
      channel = new BroadcastChannel('whatsapp_call_sync')
      channel.onmessage = (event) => {
        const { type, userId } = event.data
        // Only sync events triggered by the same user in another tab
        if (userId === useAuthStore.getState().user?.id) {
          if (type === 'CALL_ACCEPTED_ELSEWHERE' || type === 'CALL_REJECTED_ELSEWHERE' || type === 'CALL_ENDED_ELSEWHERE') {
            resetCall()
          }
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser', e)
    }

    return () => {
      if (channel) channel.close()
    }
  }, [resetCall])

  // Send END_CALL signal if tab is closed/refreshed during active call
  useEffect(() => {
    const handleUnload = () => {
      const { activeCall, callStatus } = useCallStore.getState()
      if (activeCall && callStatus !== 'IDLE') {
        sendCallSignal({
          type: 'END_CALL',
          callerId: user?.id,
          targetUserId: activeCall.isIncoming ? activeCall.callerId : activeCall.targetUserId
        })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user])

  // Caller side: Initiate WebRTC call when activeCall is set and isIncoming is false
  useEffect(() => {
    if (!activeCall || activeCall.isIncoming || peerConnection || !user) return

    const initiateCall = async () => {
      // Transition call status to RINGING so caller sees "Calling..." screen
      setCallState({ callStatus: 'RINGING' })
      
      try {
        const pc = await setupPeerConnection(activeCall.isVideo)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        sendCallSignal({
          type: 'OFFER',
          payload: offer,
          callerId: user.id,
          targetUserId: activeCall.targetUserId,
          isVideo: activeCall.isVideo,
          callerName: user.fullName,
          callerAvatar: user.profilePicture
        })
      } catch (err) {
        console.error('Error initiating call:', err)
        resetCall()
      }
    }

    initiateCall()
  }, [activeCall, peerConnection, user])

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream, callStatus])

  const processQueuedCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift()
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.error('Error adding queued ice candidate', e)
        }
      }
    }
  }

  const handleSignal = async (signal) => {
    const pc = useCallStore.getState().peerConnection

    switch (signal.type) {
      case 'OFFER':
        if (useCallStore.getState().callStatus !== 'IDLE') {
          // Already in a call, reject
          sendCallSignal({ ...signal, type: 'END_CALL', targetUserId: signal.callerId, callerId: user.id })
          return
        }
        setCallState({
          activeCall: {
            callerId: signal.callerId,
            targetUserId: signal.targetUserId,
            isVideo: signal.isVideo,
            isIncoming: true,
            callerName: signal.callerName,
            callerAvatar: signal.callerAvatar,
            offer: signal.payload
          },
          callStatus: 'RINGING'
        })
        break
      case 'ANSWER':
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload))
          setCallState({ callStatus: 'ONGOING' })
          await processQueuedCandidates(pc)
        }
        break
      case 'ICE_CANDIDATE':
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload))
          } catch (e) {
            console.error('Error adding received ice candidate', e)
          }
        } else {
          iceCandidatesQueue.current.push(signal.payload)
        }
        break
      case 'END_CALL':
        resetCall()
        try {
          const channel = new BroadcastChannel('whatsapp_call_sync')
          channel.postMessage({ type: 'CALL_ENDED_ELSEWHERE', userId: user?.id })
          channel.close()
        } catch (e) {}
        break
      default:
        break
    }
  }

  const setupPeerConnection = async (isVideo) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    
    // Setup local stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      })
      setCallState({ localStream: stream })
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
    } catch (err) {
      console.error('Failed to get local stream', err)
      toast.error('Could not access microphone/camera. Please check permissions.')
      throw err
    }

    // Handle remote stream with fallback for empty track stream groups
    let remoteStreamObj = null
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setCallState({ remoteStream: event.streams[0] })
      } else {
        if (!remoteStreamObj) {
          remoteStreamObj = new MediaStream()
          setCallState({ remoteStream: remoteStreamObj })
        }
        remoteStreamObj.addTrack(event.track)
      }
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const { activeCall } = useCallStore.getState()
        if (activeCall) {
          sendCallSignal({
            type: 'ICE_CANDIDATE',
            payload: event.candidate,
            callerId: user.id,
            targetUserId: activeCall.isIncoming ? activeCall.callerId : activeCall.targetUserId
          })
        }
      }
    }

    // Handle connection state changes to tear down call screen on connection drops
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === 'failed' || state === 'closed') {
        resetCall()
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (state === 'failed' || state === 'closed') {
        resetCall()
      }
    }

    setCallState({ peerConnection: pc })
    return pc
  }

  const acceptCall = async () => {
    if (!activeCall || !activeCall.offer) return
    setCallState({ callStatus: 'ONGOING' })

    try {
      const pc = await setupPeerConnection(activeCall.isVideo)
      await pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer))
      await processQueuedCandidates(pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      sendCallSignal({
        type: 'ANSWER',
        payload: answer,
        callerId: user.id,
        targetUserId: activeCall.callerId
      })
      
      try {
        const channel = new BroadcastChannel('whatsapp_call_sync')
        channel.postMessage({ type: 'CALL_ACCEPTED_ELSEWHERE', userId: user?.id })
        channel.close()
      } catch (e) {}
    } catch (err) {
      rejectCall()
    }
  }

  const rejectCall = () => {
    if (activeCall) {
      sendCallSignal({
        type: 'END_CALL',
        callerId: user.id,
        targetUserId: activeCall.callerId
      })
    }
    resetCall()
    
    try {
      const channel = new BroadcastChannel('whatsapp_call_sync')
      channel.postMessage({ type: 'CALL_REJECTED_ELSEWHERE', userId: user?.id })
      channel.close()
    } catch (e) {}
  }

  const hangUp = () => {
    if (activeCall) {
      sendCallSignal({
        type: 'END_CALL',
        callerId: user.id,
        targetUserId: activeCall.isIncoming ? activeCall.callerId : activeCall.targetUserId
      })
    }
    resetCall()
    
    try {
      const channel = new BroadcastChannel('whatsapp_call_sync')
      channel.postMessage({ type: 'CALL_ENDED_ELSEWHERE', userId: user?.id })
      channel.close()
    } catch (e) {}
  }

  if (callStatus === 'IDLE') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      {callStatus === 'RINGING' && activeCall?.isIncoming && (
        <div className="bg-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-bounce-slight">
          <img src={activeCall.callerAvatar || `https://ui-avatars.com/api/?name=${activeCall.callerName}`} className="w-24 h-24 rounded-full mb-4 animate-pulse object-cover border border-gray-700" />
          <h2 className="text-2xl text-white font-bold mb-2">{activeCall.callerName}</h2>
          <p className="text-gray-400 mb-8">Incoming {activeCall.isVideo ? 'Video' : 'Voice'} Call...</p>
          
          <div className="flex gap-6">
            <button onClick={rejectCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" /></svg>
            </button>
            <button onClick={acceptCall} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {(callStatus === 'ONGOING' || (callStatus === 'RINGING' && !activeCall?.isIncoming)) && (
        <div className="w-full h-full relative flex flex-col">
          <div className="flex-1 bg-black flex items-center justify-center relative">
            {activeCall?.isVideo ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                <img src={activeCall?.callerAvatar || `https://ui-avatars.com/api/?name=${activeCall?.callerName}`} className="w-32 h-32 rounded-full mb-4 object-cover border border-gray-700" />
                <h2 className="text-3xl text-white font-semibold">{activeCall?.callerName}</h2>
                <p className="text-green-400 mt-2">{callStatus === 'RINGING' ? 'Calling...' : '00:00'}</p>
              </div>
            )}
            
            {activeCall?.isVideo && (
              <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-6 pb-4">
            <button onClick={useCallStore.getState().toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-black' : 'bg-white/20 text-white'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMuted ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> 
                         : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />}
              </svg>
            </button>
            
            {activeCall?.isVideo && (
              <button onClick={useCallStore.getState().toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-white text-black' : 'bg-white/20 text-white'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            <button onClick={hangUp} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
