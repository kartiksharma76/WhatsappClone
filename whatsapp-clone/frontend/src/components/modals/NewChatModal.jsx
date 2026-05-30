import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { userAPI, chatAPI } from '../../services/api'
import { useChatStore } from '../../store'

export default function NewChatModal({ onClose }) {
  const [query,   setQuery]   = useState('')
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const { setActiveChat, setChats, chats } = useChatStore()
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(query.trim()), 350)
    return () => clearTimeout(timerRef.current)
  }, [query])

  async function search(q) {
    setLoading(true)
    try {
      const { data } = await userAPI.searchUsers(q)
      setUsers(data.data?.content || [])
    } catch { toast.error('Search failed') }
    finally   { setLoading(false) }
  }

  async function startChat(userId) {
    try {
      const { data } = await chatAPI.createPrivate(userId)
      const chat = data.data
      const exists = chats.find(c => c.id === chat.id)
      if (!exists) setChats([chat, ...chats])
      setActiveChat(chat.id)
      onClose()
    } catch { toast.error('Could not open chat') }
  }

  return (
    <Modal title="New Chat" onClose={onClose}>
      {/* Search bar */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          autoFocus
          type="text"
          placeholder="Search by name or phone…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                     bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Results */}
      <div className="overflow-y-auto max-h-72 space-y-1">
        {loading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
        {!loading && users.length === 0 && query && (
          <p className="text-center text-sm text-gray-400 py-6">No users found</p>
        )}
        {users.map(user => (
          <button key={user.id} onClick={() => startChat(user.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <img
              src={user.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=22c55e&color=fff&size=48`}
              alt={user.fullName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{user.phone}</p>
            </div>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0
              ${user.status === 'ONLINE'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
              {user.status === 'ONLINE' ? 'Online' : 'Offline'}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

/* ─── Reusable modal shell ─────────────────────────────────────────────────── */
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md
                      flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {/* Optional footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">{footer}</div>
        )}
      </div>
    </div>
  )
}

export function Spinner({ size = 6 }) {
  return (
    <div className={`w-${size} h-${size} border-2 border-primary-500 border-t-transparent
                     rounded-full animate-spin`} />
  )
}
