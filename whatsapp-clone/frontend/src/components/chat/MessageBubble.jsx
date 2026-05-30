import { useState } from 'react'
import { format } from 'date-fns'
import { messageAPI } from '../../services/api'
import { useChatStore } from '../../store'
import { toast } from 'react-toastify'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export default function MessageBubble({ message, isMine, showAvatar, prevMessage, onReply, onEdit }) {
  const { updateMessage, deleteMessage } = useChatStore()
  const [showActions, setShowActions]     = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)

  const isConsecutive = prevMessage &&
    prevMessage.sender?.id === message.sender?.id &&
    new Date(message.createdAt) - new Date(prevMessage.createdAt) < 60000

  if (message.isDeleted) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
        <div className={`px-3 py-2 rounded-xl max-w-xs text-sm italic text-gray-400
          ${isMine ? 'bg-chat-mine dark:bg-chat-mine-dark' : 'bg-chat-other dark:bg-chat-other-dark'}`}>
          🚫 This message was deleted
        </div>
      </div>
    )
  }

  async function handleReact(emoji) {
    try {
      await messageAPI.reactToMessage({ messageId: message.id, emoji })
      setShowEmojiPicker(false)
    } catch { toast.error('Could not add reaction') }
  }

  async function handleDelete(forEveryone) {
    try {
      await messageAPI.deleteMessage(message.id, forEveryone)
      deleteMessage(message.chat?.id || message.chatId, message.id)
      setShowDeleteOptions(false)
    } catch { toast.error('Could not delete message') }
  }

  async function handleStar() {
    try {
      const chatId = message.chat?.id || message.chatId
      if (message.isStarred) {
        await messageAPI.unstarMessage(message.id)
        updateMessage(chatId, message.id, { isStarred: false })
      } else {
        await messageAPI.starMessage(message.id)
        updateMessage(chatId, message.id, { isStarred: true })
      }
    } catch { toast.error('Failed to star message') }
  }

  const timeStr = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : ''

  const reactionEntries = message.reactions
    ? Object.entries(message.reactions).filter(([, count]) => count > 0)
    : []

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} group
                  ${isConsecutive ? 'mb-0.5' : 'mb-1'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false) }}
    >
      {/* Avatar for group chats */}
      {showAvatar && !isMine && (
        <img
          src={message.sender?.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.fullName || '?')}&background=6366f1&color=fff&size=32`}
          alt={message.sender?.fullName}
          className={`w-8 h-8 rounded-full object-cover mr-1 self-end flex-shrink-0 ${isConsecutive ? 'invisible' : ''}`}
        />
      )}

      <div className="relative max-w-sm lg:max-w-md xl:max-w-lg">
        {/* Action buttons on hover */}
        {showActions && (
          <div className={`absolute top-0 ${isMine ? '-left-32' : '-right-32'} flex items-center gap-1 z-10`}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="React"
              className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-gray-500 hover:text-gray-700 text-sm"
            >
              😊
            </button>
            <button
              onClick={onReply}
              title="Reply"
              className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-gray-500 hover:text-gray-700"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
              </svg>
            </button>
            <button
              onClick={handleStar}
              title={message.isStarred ? 'Unstar' : 'Star'}
              className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-yellow-500 hover:text-yellow-600"
            >
              <svg className={`w-3.5 h-3.5 ${message.isStarred ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </button>
            {isMine && (
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('SHOW_MESSAGE_INFO', { detail: message }))}
                title="Message Info"
                className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-indigo-500 hover:text-indigo-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            {isMine && message.messageType === 'TEXT' && (
              <button
                onClick={onEdit}
                title="Edit message"
                className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-amber-500 hover:text-amber-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {/* Forward button */}
            {onReply && (
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('FORWARD_MESSAGE', { detail: message }))}
                title="Forward"
                className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-blue-500 hover:text-blue-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                title="Delete"
                className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow text-red-400 hover:text-red-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>

              {showDeleteOptions && (
                <div className={`absolute top-full mt-1 ${isMine ? 'right-0' : 'left-0'} w-40 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100 dark:border-gray-600`}>
                  <button onClick={() => handleDelete(false)} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Delete for me
                  </button>
                  {isMine && (
                    <button onClick={() => handleDelete(true)} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 border-t border-gray-100 dark:border-gray-600">
                      Delete for everyone
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick emoji picker */}
        {showEmojiPicker && (
          <div className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-10 flex gap-1 bg-white dark:bg-gray-700
                           rounded-full shadow-lg px-2 py-1 z-20 animate-fade-in`}>
            {QUICK_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition-transform text-lg">
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-3 py-2 rounded-2xl shadow-sm
          ${isMine
            ? 'bg-chat-mine dark:bg-chat-mine-dark rounded-tr-sm'
            : 'bg-chat-other dark:bg-chat-other-dark rounded-tl-sm'}`}
        >
          {/* Group sender name */}
          {showAvatar && !isMine && !isConsecutive && (
            <p className="text-xs font-semibold text-indigo-500 mb-1">{message.sender?.fullName}</p>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className={`mb-1 pl-2 border-l-3 rounded text-xs border-primary-500
                             bg-black/5 dark:bg-white/10 py-1 pr-1`}>
              <p className="font-medium text-primary-600">{message.replyTo.sender?.fullName}</p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                {message.replyTo.content || '📎 Attachment'}
              </p>
            </div>
          )}

          {/* Content */}
          <MessageContent message={message} />

          {/* Time + status */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? '' : 'pl-1'}`}>
            {message.isStarred && (
              <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            )}
            {message.isEdited && (
              <span className="text-xs text-gray-400 italic">edited</span>
            )}
            <span className="text-xs text-gray-400">{timeStr}</span>
            {isMine && <DeliveryTick status={message.status} />}
          </div>
        </div>

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className={`flex gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {reactionEntries.map(([emoji, count]) => (
              <span key={emoji}
                className="text-xs bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5 shadow flex items-center gap-0.5">
                {emoji} <span className="text-gray-500">{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AudioPlayer({ fileUrl }) {
  const [speed, setSpeed] = useState(1)
  const audioRef = React.useRef(null)

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1
    setSpeed(nextSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }

  return (
    <div className="flex items-center gap-2">
      <svg className="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z"/>
        <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
      <audio ref={audioRef} controls src={fileUrl} className="max-w-[200px]" />
      <button 
        onClick={toggleSpeed} 
        className="ml-1 text-xs font-bold bg-white/50 dark:bg-black/20 text-primary-600 dark:text-primary-400 rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
        title="Playback Speed"
      >
        {speed}x
      </button>
    </div>
  )
}

function formatRichText(text) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')
  html = html.replace(/~(.*?)~/g, '<del>$1</del>')
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-2 rounded text-xs my-1 font-mono overflow-x-auto">$1</pre>')
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 text-red-500 dark:text-red-400 px-1 rounded text-xs">$1</code>')
  html = html.replace(/\n/g, '<br/>')

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function MessageContent({ message }) {
  if (message.messageType === 'IMAGE') {
    return (
      <a href={message.fileUrl} target="_blank" rel="noreferrer">
        <img src={message.fileUrl} alt="photo"
          className="max-w-xs rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-opacity" />
      </a>
    )
  }
  if (message.messageType === 'VOICE' || message.messageType === 'AUDIO') {
    return <AudioPlayer fileUrl={message.fileUrl} />
  }
  if (message.messageType === 'FILE') {
    return (
      <a href={message.fileUrl} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 text-blue-500 hover:underline">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
        </svg>
        <span className="text-sm truncate max-w-[200px]">{message.fileName || 'File'}</span>
      </a>
    )
  }

  if (message.messageType === 'CONTACT') {
    let data = {}
    try { data = JSON.parse(message.content) } catch {}
    return (
      <div className="flex flex-col bg-white/50 dark:bg-black/20 rounded-lg p-3 min-w-[200px]">
        <div className="flex items-center gap-3 mb-3 border-b border-gray-200/50 dark:border-gray-700/50 pb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {data.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{data.phone}</p>
          </div>
        </div>
        <button className="text-blue-500 font-medium text-sm hover:underline w-full text-center" onClick={() => toast.success('Contact saved locally!')}>
          Save Contact
        </button>
      </div>
    )
  }

  if (message.messageType === 'POLL') {
    let data = { question: '', options: [] }
    try { data = JSON.parse(message.content) } catch {}
    return (
      <div className="flex flex-col bg-white/50 dark:bg-black/20 rounded-lg p-3 min-w-[250px]">
        <div className="flex items-start gap-2 mb-3">
          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <p className="font-semibold text-gray-900 dark:text-white leading-tight">{data.question}</p>
        </div>
        <div className="flex flex-col gap-2">
          {data.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 p-2 bg-white/50 dark:bg-black/20 rounded-md cursor-pointer hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
              <input type="radio" name={`poll-${message.id}`} className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500" onClick={() => toast.success('Vote recorded locally!')} />
              <span className="text-sm text-gray-800 dark:text-gray-200">{opt}</span>
            </label>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 mt-2 text-right uppercase font-semibold tracking-wider">Select one option</div>
      </div>
    )
  }

  if (message.messageType === 'PAYMENT') {
    let data = {}
    try { data = JSON.parse(message.content) } catch {}
    return (
      <div className="flex flex-col bg-white/50 dark:bg-black/20 rounded-lg p-3 min-w-[200px]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
             <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-lg">{data.amount} {data.currency}</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium tracking-wide uppercase">Payment Sent</p>
          </div>
        </div>
        {data.note && <p className="text-sm text-gray-700 dark:text-gray-300 italic border-t border-gray-200/50 dark:border-gray-700/50 pt-2 mt-1">"{data.note}"</p>}
      </div>
    )
  }

  if (message.messageType === 'EVENT') {
    let data = {}
    try { data = JSON.parse(message.content) } catch {}
    const dateObj = data.date ? new Date(data.date) : new Date()
    return (
      <div className="flex flex-col bg-white/50 dark:bg-black/20 rounded-lg p-3 min-w-[220px]">
        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-center bg-cyan-100 dark:bg-cyan-900/30 rounded-lg w-12 h-12 overflow-hidden border border-cyan-200 dark:border-cyan-800 flex-shrink-0">
            <div className="bg-cyan-500 text-white text-[10px] font-bold uppercase w-full text-center py-0.5">{format(dateObj, 'MMM')}</div>
            <div className="text-lg font-bold text-cyan-700 dark:text-cyan-300 leading-none mt-1">{format(dateObj, 'd')}</div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{data.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{format(dateObj, 'h:mm a')}</p>
            {data.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 line-clamp-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {data.location}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }
  // TEXT / EMOJI
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{formatRichText(message.content)}</p>
      {message.linkPreviewTitle && (
        <a href={message.content.match(/(https?:\/\/[^\s]+)/)?.[0] || '#'} target="_blank" rel="noreferrer" 
           className="mt-1 block max-w-xs bg-black/5 dark:bg-white/5 rounded overflow-hidden hover:opacity-90 transition-opacity border border-black/10 dark:border-white/10">
          {message.linkPreviewImage && (
            <img src={message.linkPreviewImage} alt={message.linkPreviewTitle} className="w-full h-32 object-cover" />
          )}
          <div className="p-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{message.linkPreviewTitle}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{message.linkPreviewDesc}</p>
          </div>
        </a>
      )}
    </div>
  )
}

function DeliveryTick({ status }) {
  if (status === 'SEEN') {
    return (
      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0.41 13.41L6 19l1.41-1.42L0.41 11 0 11.41l.41 2zM4 19l16-16-1.41-1.42L4 16.17 9.76 10.41 8.34 9 4 13.34 4 19z"/>
        <path d="M7.5 19l14-14" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  }
  if (status === 'DELIVERED') {
    return (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.42L1.83 12 .41 13.41z"/>
      </svg>
    )
  }
  // SENT
  return (
    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  )
}
