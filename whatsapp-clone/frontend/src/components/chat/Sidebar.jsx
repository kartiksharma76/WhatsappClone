import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useChatStore, useAuthStore, useUIStore } from '../../store'
import { chatAPI, userAPI } from '../../services/api'
import ChatListItem     from './ChatListItem'
import NewChatModal     from '../modals/NewChatModal'
import NewGroupModal    from '../modals/NewGroupModal'
import BroadcastModal   from '../modals/BroadcastModal'
import ProfileModal     from '../modals/ProfileModal'
import StarredMessagesModal from '../modals/StarredMessagesModal'
import ListManagerModal from '../modals/ListManagerModal'
import SettingsModal    from '../modals/SettingsModal'
import StatusViewer         from '../status/StatusViewer'
import CommunitiesViewer    from './CommunitiesViewer'
import KeypadModal          from '../modals/KeypadModal'
import { formatDistanceToNow } from 'date-fns'

export default function Sidebar({ onLogout }) {
  const { chats, setChats, activeChatId, setActiveChat, searchQuery, setSearchQuery } = useChatStore()
  const { user } = useAuthStore()
  const { darkMode, toggleDarkMode } = useUIStore()

  const [showNewChat,   setShowNewChat]   = useState(false)
  const [showNewGroup,  setShowNewGroup]  = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showProfile,   setShowProfile]   = useState(false)
  const [showStarred,   setShowStarred]   = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [showSettings,  setShowSettings]  = useState(false)
  const [showListManager, setShowListManager] = useState(false)
  const [showKeypad,    setShowKeypad]    = useState(false)
  const [tab,           setTab]           = useState('all') // all | pinned | archived
  const [customLists,   setCustomLists]   = useState(() => {
    const saved = localStorage.getItem('chat_lists')
    return saved ? JSON.parse(saved) : []
  })
  const [searchResults, setSearchResults] = useState({ users: [], chats: [] })
  const [isSearching,   setIsSearching]   = useState(false)

  const startAiChat = async () => {
    try {
      const { data } = await chatAPI.getOrCreateAiChat()
      const chat = data.data
      const exists = chats.find(c => c.id === chat.id)
      if (!exists) setChats([chat, ...chats])
      setActiveChat(chat.id)
    } catch {
      toast.error('Could not connect to Meta AI')
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], chats: [] })
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const [usersRes, chatsRes] = await Promise.all([
          userAPI.searchUsers(searchQuery),
          chatAPI.searchChats(searchQuery)
        ])
        setSearchResults({
          users: usersRes.data.data.content || [],
          chats: chatsRes.data.data || []
        })
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const startPrivateChat = async (userId) => {
    try {
      const { data } = await chatAPI.createPrivate(userId)
      const chat = data.data
      const exists = chats.find(c => c.id === chat.id)
      if (!exists) setChats([chat, ...chats])
      setActiveChat(chat.id)
      setSearchQuery('')
    } catch {
      toast.error('Could not start chat')
    }
  }

  const filtered = chats.filter(c => {
    const isCustom = customLists.find(l => l.id === tab)
    if (isCustom) {
      if (!isCustom.chats.includes(c.id)) return false
    } else {
      const matchesTab =
        tab === 'all'      ? !c.isArchived :
        tab === 'pinned'   ? c.isPinned    :
        tab === 'archived' ? c.isArchived  : true
      if (!matchesTab) return false
    }

    const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const pinnedChats   = filtered.filter(c => c.isPinned)
  const unpinnedChats = filtered.filter(c => !c.isPinned)

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 flex-shrink-0">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700">
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-2">
          <img
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.fullName}&background=22c55e&color=fff`}
            alt="me"
            className="w-10 h-10 rounded-full object-cover"
          />
        </button>

        <span className="font-semibold text-gray-800 dark:text-white text-lg">ChatApp</span>

        <div className="flex items-center gap-1 relative">
          {/* Meta AI Button */}
          <button
            onClick={startAiChat}
            title="Meta AI Assistant"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300
                       group relative flex items-center justify-center"
          >
            <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <svg className="w-5 h-5 text-cyan-500 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" stroke="url(#ai-grad)" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="5" stroke="url(#ai-grad)" strokeWidth="1.5" />
              <defs>
                <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </button>

          {/* New chat */}
          <button
            onClick={() => setShowNewChat(true)}
            title="New chat"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
          </button>

          {/* Keypad */}
          <button
            onClick={() => setShowKeypad(true)}
            title="Dialpad"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </button>

          {/* Kebab menu */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              {[
                { label: 'New group',         action: () => { setShowNewGroup(true); setShowMenu(false) } },
                { label: 'New broadcast',     action: () => { setShowBroadcast(true); setShowMenu(false) } },
                { label: 'Linked Devices',    action: () => { toast.info('Linked Devices opened'); setShowMenu(false) } },
                { label: 'Starred messages',  action: () => { setShowStarred(true); setShowMenu(false) } },
                { label: 'Manage lists',      action: () => { setShowListManager(true); setShowMenu(false) } },
                { label: 'Channels',          action: () => { toast.info('Channels opened'); setShowMenu(false) } },
                { label: 'Advertise',         action: () => { toast.info('Advertise opened'); setShowMenu(false) } },
                { label: 'Status Privacy',    action: () => { toast.info('Status Privacy opened'); setShowMenu(false) } },
                { label: darkMode ? 'Light mode' : 'Dark mode', action: () => { toggleDarkMode(); setShowMenu(false) } },
                { label: 'Settings',          action: () => { setShowSettings(true); setShowMenu(false) } },
                { label: 'Log out',           action: () => { onLogout(); setShowMenu(false) }, danger: true },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-600
                    ${item.danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-white dark:bg-gray-800">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2 gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200
                       placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      {!searchQuery && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
          {['all', 'pinned', 'archived', 'updates', 'communities', ...customLists.map(l => l.id)].map(t => {
            const isCustom = customLists.find(l => l.id === t)
            const display = isCustom ? isCustom.name : t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-none px-4 py-2 text-xs font-medium capitalize transition-colors whitespace-nowrap
                  ${tab === t
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 dark:text-gray-400'}`}
              >
                {display}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Lists / Search Results ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {tab === 'updates' ? (
          <StatusViewer />
        ) : tab === 'communities' ? (
          <CommunitiesViewer chats={chats} />
        ) : isSearching ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searchQuery ? (
              <>
                {/* Global Chats */}
                {searchResults.chats.length > 0 && (
                  <>
                    <div className="px-4 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Chats</div>
                    {searchResults.chats.map(chat => (
                      <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onClick={() => setActiveChat(chat.id)} />
                    ))}
                  </>
                )}
                {/* Global Contacts */}
                {searchResults.users.length > 0 && (
                  <>
                    <div className="px-4 py-1 mt-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contacts</div>
                    {searchResults.users.map(u => (
                      <div key={u.id} onClick={() => startPrivateChat(u.id)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.fullName}&background=22c55e&color=fff`} alt={u.fullName} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {searchResults.chats.length === 0 && searchResults.users.length === 0 && (
                  <div className="text-center p-4 text-gray-500 text-sm">No results found for "{searchQuery}"</div>
                )}
              </>
        ) : (
          <>
            {pinnedChats.length > 0 && (
          <>
            <div className="px-4 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Pinned
            </div>
            {pinnedChats.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onClick={() => setActiveChat(chat.id)}
              />
            ))}
            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4 my-1" />
          </>
        )}

        {unpinnedChats.map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            onClick={() => setActiveChat(chat.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            No chats found
          </div>
        )}
        </>
        )}
      </div>

      {/* Modals */}
      {showNewChat  && <NewChatModal  onClose={() => setShowNewChat(false)} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
      {showBroadcast&& <BroadcastModal onClose={() => setShowBroadcast(false)} />}
      {showProfile  && <ProfileModal  onClose={() => setShowProfile(false)} />}
      {showStarred  && <StarredMessagesModal onClose={() => setShowStarred(false)} />}
      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onLogout={onLogout} />}
      {showListManager && <ListManagerModal customLists={customLists} setCustomLists={setCustomLists} chats={chats} onClose={() => setShowListManager(false)} />}
      {showKeypad && <KeypadModal onClose={() => setShowKeypad(false)} />}
    </aside>
  )
}
