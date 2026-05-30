import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || '/api/ws'

let stompClient = null
const subscriptions = new Map()

/**
 * Connect to the WebSocket / STOMP broker.
 * @param {string} token  JWT access token
 * @param {object} handlers  { onMessage, onTyping, onPresence, onDelivery }
 */
export function connectWebSocket(token, handlers = {}) {
  if (stompClient?.connected) return

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      console.log('[WS] Connected')
      handlers.onConnect?.()
    },

    onDisconnect: () => {
      console.log('[WS] Disconnected')
      handlers.onDisconnect?.()
    },

    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame.headers?.message)
    },
  })

  stompClient.activate()
}

export function disconnectWebSocket() {
  stompClient?.deactivate()
  subscriptions.clear()
}

/** Subscribe to a chat room for new messages. */
export function subscribeToChatMessages(chatId, callback) {
  if (!stompClient?.connected) return
  const dest = `/topic/chat/${chatId}`
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Unsubscribe from a chat room. */
export function unsubscribeFromChat(chatId) {
  const dest = `/topic/chat/${chatId}`
  subscriptions.get(dest)?.unsubscribe()
  subscriptions.delete(dest)
}

/** Unsubscribe from typing indicators for a chat. */
export function unsubscribeFromTyping(chatId) {
  const dest = `/topic/typing/${chatId}`
  subscriptions.get(dest)?.unsubscribe()
  subscriptions.delete(dest)
}

/** Unsubscribe from delivery / seen events for a chat. */
export function unsubscribeFromDelivery(chatId) {
  const dest = `/topic/delivery/${chatId}`
  subscriptions.get(dest)?.unsubscribe()
  subscriptions.delete(dest)
}

/** Subscribe to global messages for the user. */
export function subscribeToGlobalMessages(userId, callback) {
  if (!stompClient?.connected) return
  const dest = `/topic/user/${userId}/messages`
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Subscribe to typing indicators for a chat. */
export function subscribeToTyping(chatId, callback) {
  if (!stompClient?.connected) return
  const dest = `/topic/typing/${chatId}`
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Subscribe to delivery / seen events for a chat. */
export function subscribeToDelivery(chatId, callback) {
  if (!stompClient?.connected) return
  const dest = `/topic/delivery/${chatId}`
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Subscribe to global user presence (online/offline). */
export function subscribeToPresence(callback) {
  if (!stompClient?.connected) return
  const dest = '/topic/presence'
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Subscribe to status updates (create, delete, view). */
export function subscribeToStatusUpdates(callback) {
  if (!stompClient?.connected) return
  const dest = '/topic/status'
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Unsubscribe from status updates. */
export function unsubscribeFromStatusUpdates() {
  const dest = '/topic/status'
  subscriptions.get(dest)?.unsubscribe()
  subscriptions.delete(dest)
}

/** Publish a typing indicator event. */
export function sendTypingEvent(chatId, userId, userName, isTyping) {
  if (!stompClient?.connected) return
  stompClient.publish({
    destination: '/app/typing',
    body: JSON.stringify({ chatId, userId, userName, typing: isTyping }),
  })
}

/** Publish user presence update. */
export function sendPresenceEvent(userId, status) {
  if (!stompClient?.connected) return
  stompClient.publish({
    destination: '/app/presence',
    body: JSON.stringify({ userId, status }),
  })
}

/** Publish seen event. */
export function sendSeenEvent(chatId, userId) {
  if (!stompClient?.connected) return
  stompClient.publish({
    destination: '/app/seen',
    body: JSON.stringify({ chatId, userId, status: 'SEEN' }),
  })
}

/** Subscribe to user's call signaling topic. */
export function subscribeToCallSignals(userId, callback) {
  if (!stompClient?.connected) return
  const dest = `/topic/call/${userId}`
  if (subscriptions.has(dest)) return
  const sub = stompClient.subscribe(dest, (msg) => callback(JSON.parse(msg.body)))
  subscriptions.set(dest, sub)
}

/** Unsubscribe from user's call signaling topic. */
export function unsubscribeFromCallSignals(userId) {
  const dest = `/topic/call/${userId}`
  subscriptions.get(dest)?.unsubscribe()
  subscriptions.delete(dest)
}

/** Publish call signaling message. */
export function sendCallSignal(signal) {
  if (!stompClient?.connected) return
  stompClient.publish({
    destination: '/app/call/signal',
    body: JSON.stringify(signal),
  })
}

export function isConnected() {
  return stompClient?.connected ?? false
}
