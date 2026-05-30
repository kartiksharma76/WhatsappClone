import { formatDistanceToNow } from 'date-fns'
import { useChatStore } from '../../store'

export default function ChatListItem({ chat, isActive, onClick }) {
  const { typingUsers } = useChatStore()
  const typing = typingUsers[chat.id] ? Object.values(typingUsers[chat.id]) : []

  const avatarUrl = chat.icon
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || '?')}&background=22c55e&color=fff&size=64`

  const lastMsg = chat.lastMessage
  let preview = ''
  if (typing.length) {
    preview = `${typing[0]} is typing…`
  } else if (lastMsg) {
    if (lastMsg.isDeleted) preview = 'This message was deleted'
    else if (lastMsg.messageType === 'IMAGE') preview = '📷 Photo'
    else if (lastMsg.messageType === 'AUDIO' || lastMsg.messageType === 'VOICE') preview = '🎤 Voice message'
    else if (lastMsg.messageType === 'FILE')  preview = '📎 File'
    else preview = lastMsg.content || ''
  }

  const timeStr = chat.lastMessage?.createdAt
    ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: false })
        .replace('about ', '').replace('less than a minute', 'now')
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-colors relative ${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl}
          alt={chat.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {/* Online dot for private chats */}
        {chat.chatType === 'PRIVATE' && chat.status === 'ONLINE' && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full
                           border-2 border-white dark:border-gray-800" />
        )}
        {/* Group indicator */}
        {chat.chatType === 'GROUP' && (
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full
                           flex items-center justify-center border-2 border-white dark:border-gray-800">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </span>
        )}
      </div>

      {/* Chat info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {chat.name || 'Unknown'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
            {timeStr}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className={`text-sm truncate ${typing.length
            ? 'text-primary-500 italic'
            : 'text-gray-500 dark:text-gray-400'}`}>
            {preview || <span className="opacity-0">-</span>}
          </p>
          {chat.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 bg-primary-500 text-white text-xs
                             font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
          {chat.isPinned && !chat.unreadCount && (
            <svg className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
          )}
          {chat.isMuted && !chat.unreadCount && !chat.isPinned && (
            <svg className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
               <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 px-1 py-1 rounded-lg shadow-sm">
        <button
          title={chat.isPinned ? "Unpin" : "Pin"}
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await import('../../services/api').then(m => m.chatAPI.pinChat(chat.id, !chat.isPinned))
              useChatStore.getState().updateChat(chat.id, { isPinned: !chat.isPinned })
            } catch {}
          }}
          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${chat.isPinned ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
        </button>
        <button
          title={chat.isArchived ? "Unarchive" : "Archive"}
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await import('../../services/api').then(m => m.chatAPI.archiveChat(chat.id, !chat.isArchived))
              useChatStore.getState().updateChat(chat.id, { isArchived: !chat.isArchived })
            } catch {}
          }}
          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${chat.isArchived ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
          </svg>
        </button>
        <button
          title={chat.isMuted ? "Unmute" : "Mute"}
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await import('../../services/api').then(m => m.chatAPI.muteChat(chat.id, !chat.isMuted))
              useChatStore.getState().updateChat(chat.id, { isMuted: !chat.isMuted })
            } catch {}
          }}
          className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${chat.isMuted ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
             <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
      </div>
    </button>
  )
}
