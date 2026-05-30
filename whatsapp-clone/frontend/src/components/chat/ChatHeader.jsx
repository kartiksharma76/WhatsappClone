// ChatHeader.jsx
import { useState } from 'react'
import { chatAPI } from '../../services/api'
import { useChatStore, useCallStore, useAuthStore } from '../../store'
import { toast } from 'react-toastify'
import GroupInfoModal from '../modals/GroupInfoModal'
import MediaGalleryModal from '../modals/MediaGalleryModal'
import WallpaperModal from '../modals/WallpaperModal'

export function ChatHeader({ chatInfo, onToggleSearch }) {
  const { setActiveChat, setChats, chats } = useChatStore()
  const { setCallState } = useCallStore()
  const { user } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showMediaGallery, setShowMediaGallery] = useState(false)
  const [showWallpaper, setShowWallpaper] = useState(false)

  const handleCall = (isVideo) => {
    if (!chatInfo || chatInfo.chatType !== 'PRIVATE') return
    
    const targetUser = chatInfo.participants?.find(p => p.id !== user?.id)
    if (!targetUser) return

    setCallState({
      activeCall: {
        callerId: user.id,
        targetUserId: targetUser.id,
        isVideo,
        isIncoming: false,
        callerName: targetUser.fullName,
        callerAvatar: targetUser.profilePicture
      },
      callStatus: 'RINGING'
    })
  }

  if (!chatInfo) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800
                      border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          <div className="h-2 bg-gray-100 dark:bg-gray-600 rounded w-20 animate-pulse" />
        </div>
      </div>
    )
  }

  const avatar = chatInfo.icon
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatInfo.name || '?')}&background=22c55e&color=fff&size=64`

  let statusText = `${chatInfo.participants?.length || 0} participants`
  if (chatInfo.chatType === 'PRIVATE') {
    if (chatInfo.status === 'ONLINE') {
      statusText = 'Online'
    } else if (chatInfo.lastSeen) {
      const date = new Date(chatInfo.lastSeen)
      statusText = `last seen ${date.toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`
    } else {
      statusText = 'Offline'
    }
  }

  const handlePin = async () => {
    try {
      await chatAPI.pinChat(chatInfo.id, !chatInfo.isPinned)
      setChats(chats.map(c => c.id === chatInfo.id ? { ...c, isPinned: !c.isPinned } : c))
      setShowMenu(false)
    } catch { toast.error('Failed to pin chat') }
  }

  const handleArchive = async () => {
    try {
      await chatAPI.archiveChat(chatInfo.id, !chatInfo.isArchived)
      setChats(chats.map(c => c.id === chatInfo.id ? { ...c, isArchived: !c.isArchived } : c))
      setShowMenu(false)
      setActiveChat(null)
    } catch { toast.error('Failed to archive chat') }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800
                    border-b border-gray-200 dark:border-gray-700 relative">
      {/* Back button (mobile) */}
      <button
        onClick={() => setActiveChat(null)}
        className="md:hidden p-1 text-gray-500 dark:text-gray-400"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <img src={avatar} alt={chatInfo.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
          {chatInfo.name}
          {chatInfo.disappearingTimer > 0 && (
            <svg className="w-4 h-4 text-gray-500" title={`Disappearing messages active (${chatInfo.disappearingTimer}h)`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </h2>
        <p className={`text-xs truncate ${chatInfo.status === 'ONLINE' ? 'text-primary-500' : 'text-gray-400'}`}>
          {statusText}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {/* Call Buttons */}
        {chatInfo.chatType === 'PRIVATE' && !chatInfo.isBlockedByMe && (
          <>
            <button onClick={() => handleCall(false)} className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </button>
            <button onClick={() => handleCall(true)} className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
          </>
        )}

        <button onClick={onToggleSearch} className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Kebab */}
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-10 w-44 bg-white dark:bg-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            {[
              { label: chatInfo.chatType === 'GROUP' ? 'Group info' : null, action: () => { setShowMenu(false); setShowGroupInfo(true) }, show: chatInfo.chatType === 'GROUP' },
              { label: 'Media', action: () => { setShowMenu(false); setShowMediaGallery(true) }, show: true },
              { label: 'Chat themes', action: () => { setShowMenu(false); setShowWallpaper(true) }, show: true },
              { label: chatInfo.isPinned ? 'Unpin chat' : 'Pin chat', action: handlePin },
              { label: chatInfo.isArchived ? 'Unarchive' : 'Archive chat', action: handleArchive },
              { label: 'Add shortcut', action: () => { setShowMenu(false); toast.success('Shortcut added to home screen') }, show: true },
              { label: 'Schedule', action: () => { setShowMenu(false); toast.info('Schedule feature opened') }, show: true },
              { label: 'Export chat', action: async () => {
                  try {
                    const { messageAPI } = await import('../../services/api')
                    const response = await messageAPI.exportChat(chatInfo.id)
                    const url = window.URL.createObjectURL(new Blob([response.data]))
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', `chat_export_${chatInfo.id}.txt`)
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    setShowMenu(false)
                  } catch { toast.error('Failed to export chat') }
                }
              },
              { label: chatInfo.chatType === 'PRIVATE' && chatInfo.isBlockedByMe ? 'Unblock user' : 'Block user',
                action: async () => {
                  try {
                    const { useAuthStore, useChatStore } = await import('../../store')
                    const otherUser = chatInfo.participants?.find(p => p.id !== useAuthStore.getState().user?.id)
                    if (!otherUser) return
                    
                    const userAPI = (await import('../../services/api')).userAPI
                    if (chatInfo.isBlockedByMe) {
                      await userAPI.unblockUser(otherUser.id)
                      toast.success('User unblocked')
                    } else {
                      await userAPI.blockUser(otherUser.id)
                      toast.success('User blocked')
                    }
                    
                    const store = useChatStore.getState()
                    store.setChats(store.chats.map(c => 
                      c.id === chatInfo.id ? { ...c, isBlockedByMe: !c.isBlockedByMe } : c
                    ))
                    setShowMenu(false)
                  } catch { toast.error('Failed to update block status') }
                }, 
                danger: !chatInfo.isBlockedByMe, 
                show: chatInfo.chatType === 'PRIVATE' 
              },
              { label: chatInfo.chatType === 'GROUP' ? 'Leave group' : 'Delete chat',
                action: async () => {
                  try {
                    if (chatInfo.chatType === 'GROUP') await chatAPI.leaveGroup(chatInfo.id)
                    else await chatAPI.deleteChat(chatInfo.id)
                    setActiveChat(null)
                  } catch { toast.error('Failed') }
                }, danger: true, show: true },
              { label: 'Disappearing Messages',
                action: async () => {
                  const hours = prompt('Enter timer in hours (e.g. 24, 168). Enter 0 to turn off:', chatInfo.disappearingTimer || 0)
                  if (hours !== null) {
                    try {
                      const timerHours = parseInt(hours, 10) || 0
                      await chatAPI.setDisappearingTimer(chatInfo.id, timerHours)
                      useChatStore.getState().setChats(
                        useChatStore.getState().chats.map(c => 
                          c.id === chatInfo.id ? { ...c, disappearingTimer: timerHours } : c
                        )
                      )
                      toast.success(timerHours > 0 ? `Disappearing messages set to ${timerHours} hours` : 'Disappearing messages turned off')
                      setShowMenu(false)
                    } catch { toast.error('Failed to update timer') }
                  }
                }, show: true },
              { label: 'Clear chat',
                action: async () => {
                  try {
                    await chatAPI.clearChat(chatInfo.id)
                    useChatStore.getState().setMessages(chatInfo.id, [])
                    toast.success('Chat cleared')
                    setShowMenu(false)
                  } catch { toast.error('Failed to clear chat') }
                }, danger: true, show: true },
            ].filter(item => item.show !== false && item.label).map(item => (
              <button key={item.label} onClick={item.action}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-600
                  ${item.danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showGroupInfo && (
        <GroupInfoModal chatInfo={chatInfo} onClose={() => setShowGroupInfo(false)} />
      )}
      {showMediaGallery && (
        <MediaGalleryModal chatId={chatInfo.id} onClose={() => setShowMediaGallery(false)} />
      )}
      {showWallpaper && (
        <WallpaperModal chatId={chatInfo.id} onClose={() => setShowWallpaper(false)} />
      )}
    </div>
  )
}

export default ChatHeader
