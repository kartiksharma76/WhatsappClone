import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useChatStore, useAuthStore } from '../../store'
import { chatAPI, messageAPI } from '../../services/api'
import { sendTypingEvent, sendSeenEvent } from '../../services/websocket'
import MessageBubble    from './MessageBubble'
import MessageInput     from './MessageInput'
import ChatHeader       from './ChatHeader'
import TypingIndicator  from './TypingIndicator'
import { DEFAULT_WALLPAPERS } from '../modals/WallpaperModal'

const TYPING_TIMEOUT = 2000

export default function ChatWindow() {
  const { activeChatId, messages, setMessages, prependMessages, typingUsers } = useChatStore()
  const { user } = useAuthStore()

  const [chatInfo,  setChatInfo]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [page,      setPage]      = useState(0)
  const [hasMore,   setHasMore]   = useState(true)
  const [replyTo,   setReplyTo]   = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [wallpaper, setWallpaper] = useState(null)

  const messagesEndRef  = useRef(null)
  const messagesTopRef  = useRef(null)
  const typingTimerRef  = useRef(null)
  const containerRef    = useRef(null)
  const isTypingRef     = useRef(false)

  const chatMessages = messages[activeChatId] || []
  const filteredMessages = searchQuery
    ? chatMessages.filter(m => m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatMessages
  const typingList   = Object.values(typingUsers[activeChatId] || {}).filter(n => n !== user?.fullName)

  // Load chat info + first page of messages when chat changes
  useEffect(() => {
    if (!activeChatId) return
    setChatInfo(null)
    setPage(0)
    setHasMore(true)
    setReplyTo(null)
    setEditingMessage(null)
    setShowSearch(false)
    setSearchQuery('')
    loadChatInfo()
    loadMessages(0, true)
    markSeen()

    const wp = localStorage.getItem(`wallpaper_${activeChatId}`)
    setWallpaper(wp || 'default')

    const handleWallpaperChange = (e) => {
      if (e.detail.chatId === activeChatId) {
        setWallpaper(e.detail.wallpaper)
      }
    }
    window.addEventListener('wallpaperChanged', handleWallpaperChange)
    return () => window.removeEventListener('wallpaperChanged', handleWallpaperChange)
  }, [activeChatId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (page === 0) scrollToBottom()
  }, [chatMessages.length, page])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadChatInfo() {
    try {
      const { data } = await chatAPI.getChat(activeChatId)
      setChatInfo(data.data)
    } catch { /* silent */ }
  }

  async function loadMessages(pageNum, reset = false) {
    if (loading) return
    setLoading(true)
    try {
      const { data } = await messageAPI.getMessages(activeChatId, pageNum)
      const content  = (data.data?.content || []).reverse() // oldest first
      const totalPages = data.data?.totalPages || 0

      if (reset) setMessages(activeChatId, content)
      else prependMessages(activeChatId, content)

      setHasMore(pageNum < totalPages - 1)
      setPage(pageNum)
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function markSeen() {
    try {
      await messageAPI.markSeen(activeChatId)
      sendSeenEvent(activeChatId, user?.id)
    } catch { /* silent */ }
  }

  // Infinite scroll – load older messages when scrolled to top
  const handleScroll = () => {
    const el = containerRef.current
    if (!el || loading || !hasMore) return
    if (el.scrollTop < 60) loadMessages(page + 1)
  }

  // Typing indicator logic
  const handleTypingStart = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      sendTypingEvent(activeChatId, user?.id, user?.fullName, true)
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      sendTypingEvent(activeChatId, user?.id, user?.fullName, false)
    }, TYPING_TIMEOUT)
  }, [activeChatId, user])

  const getWallpaperStyle = () => {
    if (!wallpaper) return {}
    const wp = DEFAULT_WALLPAPERS.find(w => w.id === wallpaper)
    if (!wp) return {}
    if (wp.id === 'default' || wp.id === 'dark') {
      return {
        backgroundColor: wp.color,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2300000008\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      }
    }
    if (wp.color) {
      return { backgroundColor: wp.color }
    }
    return { backgroundImage: `url(${wp.url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader chatInfo={chatInfo} onToggleSearch={() => { setShowSearch(!showSearch); setSearchQuery('') }} />

      {/* Local message search bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search messages in this chat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none text-gray-900 dark:text-white"
          />
          <button onClick={() => { setSearchQuery(''); setShowSearch(false) }} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
            Cancel
          </button>
        </div>
      )}

      {/* Message list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 relative"
      >
        {/* Background layer */}
        <div className="absolute inset-0 -z-10" style={getWallpaperStyle()} />

        {loading && page === 0 && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !loading && (
          <div ref={messagesTopRef} className="flex justify-center">
            <button
              onClick={() => loadMessages(page + 1)}
              className="text-xs text-primary-600 py-2 hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {filteredMessages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender?.id === user?.id}
            showAvatar={chatInfo?.chatType === 'GROUP' && msg.sender?.id !== user?.id}
            prevMessage={chatMessages[idx - 1]}
            onReply={() => { setEditingMessage(null); setReplyTo(msg) }}
            onEdit={() => { setReplyTo(null); setEditingMessage(msg) }}
          />
        ))}

        {typingList.length > 0 && (
          <TypingIndicator names={typingList} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600
                        flex items-center gap-2">
          <div className="flex-1 pl-3 border-l-4 border-primary-500">
            <p className="text-xs font-medium text-primary-600">{replyTo.sender?.fullName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {replyTo.content || '📎 Attachment'}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Editing preview */}
      {editingMessage && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-900/40
                        flex items-center gap-2">
          <div className="flex-1 pl-3 border-l-4 border-yellow-500">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Edit Message</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {editingMessage.content}
            </p>
          </div>
          <button onClick={() => setEditingMessage(null)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      {chatInfo?.isBlockedByMe ? (
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-500">
          You have blocked this contact. Unblock to send a message.
        </div>
      ) : (
        <MessageInput
          chatId={activeChatId}
          replyToMessage={replyTo}
          onClearReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onClearEditing={() => setEditingMessage(null)}
          onTyping={handleTypingStart}
        />
      )}
    </div>
  )
}
