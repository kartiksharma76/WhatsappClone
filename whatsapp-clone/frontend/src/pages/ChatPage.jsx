import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import Sidebar       from '../components/chat/Sidebar'
import ChatWindow    from '../components/chat/ChatWindow'
import EmptyState    from '../components/chat/EmptyState'
import ForwardMessageModal from '../components/modals/ForwardMessageModal'
import MessageInfoModal    from '../components/modals/MessageInfoModal'
import { useAuthStore, useChatStore, useStatusStore } from '../store'
import { chatAPI }   from '../services/api'
import CallOverlay   from '../components/status/CallOverlay'
import { useState } from 'react'
import {
  connectWebSocket, disconnectWebSocket,
  subscribeToPresence, subscribeToChatMessages, unsubscribeFromChat,
  subscribeToTyping, unsubscribeFromTyping,
  subscribeToDelivery, unsubscribeFromDelivery,
  sendPresenceEvent, subscribeToGlobalMessages,
  subscribeToStatusUpdates, unsubscribeFromStatusUpdates,
  subscribeToCallSignals, unsubscribeFromCallSignals,
} from '../services/websocket'

export default function ChatPage() {
  const { user, accessToken, clearAuth } = useAuthStore()
  const {
    activeChatId, setChats, addMessage, updateMessage,
    setTyping, setLoading,
  } = useChatStore()
  const wsReady = useRef(false)
  const [forwardMessage, setForwardMessage] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)

  // Load initial chat list
  useEffect(() => {
    loadChats()

    const handleForward = (e) => setForwardMessage(e.detail)
    const handleInfo = (e) => setInfoMessage(e.detail)
    
    document.addEventListener('FORWARD_MESSAGE', handleForward)
    document.addEventListener('SHOW_MESSAGE_INFO', handleInfo)
    
    return () => {
      document.removeEventListener('FORWARD_MESSAGE', handleForward)
      document.removeEventListener('SHOW_MESSAGE_INFO', handleInfo)
    }
  }, [])

  // Connect WebSocket once
  useEffect(() => {
    if (!accessToken || wsReady.current) return
    wsReady.current = true

    connectWebSocket(accessToken, {
      onConnect: () => {
        if (user?.id) {
          sendPresenceEvent(user.id, 'ONLINE')
          subscribeToGlobalMessages(user.id, (msg) => {
            const store = useChatStore.getState()
            const exists = store.chats.find(c => c.id === msg.chatId)
            
            // Add the message to the store
            addMessage(msg.chatId, msg)

            if (!exists) {
              // It's a new chat, we need to load its metadata
              loadChats()
            } else if (msg.chatId !== store.activeChatId) {
              // If we are not actively looking at this chat, increment unread
              store.incrementUnread(msg.chatId)
            }
          })
          subscribeToCallSignals(user.id, (signal) => {
            document.dispatchEvent(new CustomEvent('CALL_SIGNAL_RECEIVED', { detail: signal }))
          })
        }
        subscribeToPresence((event) => {
          const store = useChatStore.getState()
          store.updateChatPresence(event.userId, event.status, event.lastSeen)
        })
        subscribeToStatusUpdates((event) => {
          useStatusStore.getState().handleStatusWSMessage(event)
        })
      },
    })

    return () => {
      sendPresenceEvent(user?.id, 'OFFLINE')
      unsubscribeFromStatusUpdates()
      if (user?.id) {
        unsubscribeFromCallSignals(user.id)
      }
      disconnectWebSocket()
      wsReady.current = false
    }
  }, [accessToken])

  // Subscribe to active chat events
  useEffect(() => {
    if (!activeChatId) return

    subscribeToChatMessages(activeChatId, (msg) => {
      if (msg.type === 'MESSAGE_DELETED') {
        useChatStore.getState().deleteMessage(activeChatId, msg.messageId)
        return
      }
      addMessage(activeChatId, msg)
    })

    subscribeToTyping(activeChatId, (event) => {
      setTyping(activeChatId, event.userId, event.userName, event.typing)
    })

    subscribeToDelivery(activeChatId, (event) => {
      // Delivery status updates handled in message list
    })

    return () => {
      unsubscribeFromChat(activeChatId)
      unsubscribeFromTyping(activeChatId)
      unsubscribeFromDelivery(activeChatId)
    }
  }, [activeChatId])

  async function loadChats() {
    setLoading(true)
    try {
      const { data } = await chatAPI.getUserChats()
      setChats(data.data?.content || [])
    } catch {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <CallOverlay />
      
      {/* Left panel – chat list */}
      <Sidebar onLogout={() => { clearAuth(); localStorage.clear(); sessionStorage.clear(); }} />

      {/* Right panel – active chat or empty state */}
      <div className="flex-1 flex flex-col">
        {activeChatId ? <ChatWindow /> : <EmptyState />}
      </div>

      {/* Modals */}
      {forwardMessage && (
        <ForwardMessageModal 
          message={forwardMessage} 
          onClose={() => setForwardMessage(null)} 
        />
      )}
      {infoMessage && (
        <MessageInfoModal 
          message={infoMessage} 
          onClose={() => setInfoMessage(null)} 
        />
      )}
    </div>
  )
}
