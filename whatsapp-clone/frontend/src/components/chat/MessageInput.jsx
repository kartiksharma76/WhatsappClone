import { useState, useRef, useEffect } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { toast } from 'react-toastify'
import { messageAPI, chatAPI } from '../../services/api'
import { useChatStore, useUIStore } from '../../store'
import { useNavigate } from 'react-router-dom'
import ContactModal from '../modals/ContactModal'
import PollModal from '../modals/PollModal'
import PaymentModal from '../modals/PaymentModal'
import EventModal from '../modals/EventModal'
import CameraModal from '../modals/CameraModal'
import ScheduleMessageModal from '../modals/ScheduleMessageModal'

export default function MessageInput({ chatId, replyToMessage, onClearReply, editingMessage, onClearEditing, onTyping }) {
  const { addMessage, updateMessage, drafts, setDraft, setActiveChat } = useChatStore()
  const { darkMode }   = useUIStore()
  const navigate       = useNavigate()

  const [text,         setText]         = useState('')
  const [showEmoji,    setShowEmoji]    = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [modalOpen,    setModalOpen]    = useState(null)
  const [sending,      setSending]      = useState(false)
  const [recording,    setRecording]    = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  
  const fileInputDocumentRef = useRef(null)
  const fileInputGalleryRef = useRef(null)
  const fileInputCameraRef = useRef(null)
  const fileInputAudioRef = useRef(null)
  const mediaRecRef    = useRef(null)
  const audioChunksRef = useRef([])

  // Load draft or editing message when chatId or editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '')
    } else {
      setText(drafts[chatId] || '')
    }
  }, [chatId, editingMessage])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.attachment-btn') && !e.target.closest('.attachment-menu')) {
        setShowAttachmentMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Custom text change handler to save drafts
  const handleTextChange = (val) => {
    setText(val)
    if (!editingMessage) {
      setDraft(chatId, val)
    }
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setShowEmoji(false)
    setSending(true)

    if (!editingMessage) {
      setDraft(chatId, '')
    }

    try {
      if (editingMessage) {
        const { data } = await messageAPI.editMessage({
          messageId: editingMessage.id,
          content,
        })
        updateMessage(chatId, data.data)
        onClearEditing()
      } else {
        const { data } = await messageAPI.sendMessage({
          chatId,
          content,
          messageType: 'TEXT',
          replyToMessageId: replyToMessage?.id,
        })
        addMessage(chatId, data.data)
        onClearReply()
      }
    } catch {
      toast.error(editingMessage ? 'Failed to edit message' : 'Failed to send message')
      setText(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    onTyping?.()
  }

  const handleFileChange = async (e) => {
    setShowAttachmentMenu(false)
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setSending(true)
    try {
      const { data } = await messageAPI.sendFile(chatId, form)
      addMessage(chatId, data.data)
    } catch {
      toast.error('Failed to send file')
    } finally {
      setSending(false)
      e.target.value = ''
    }
  }

  const handleDirectFileSend = async (file) => {
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setSending(true)
    try {
      const { data } = await messageAPI.sendFile(chatId, form)
      addMessage(chatId, data.data)
    } catch {
      toast.error('Failed to send media')
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      mediaRecRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' })
        const form = new FormData()
        form.append('file', blob, 'voice.ogg')
        setSending(true)
        try {
          const { data } = await messageAPI.sendFile(chatId, form)
          addMessage(chatId, data.data)
        } catch { toast.error('Failed to send voice message') }
        finally { setSending(false) }
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecRef.current.start()
      setRecording(true)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const handleScheduleSubmit = ({ text: scheduledText, scheduledAt }) => {
    toast.success(`Message scheduled for ${scheduledAt.toLocaleString()}`)
    setShowSchedule(false)
    setText('')
    
    // Simulate scheduling by setting a timeout (if it's within a few hours for demo purposes)
    const delay = scheduledAt.getTime() - Date.now()
    if (delay > 0 && delay < 86400000) { // less than 24 hours
      setTimeout(async () => {
        try {
          const { data } = await messageAPI.sendMessage({
            chatId,
            content: scheduledText,
            messageType: 'TEXT',
          })
          addMessage(chatId, data.data)
          toast.info('Scheduled message sent!')
        } catch {
          console.error('Failed to send scheduled message')
        }
      }, delay)
    }
  }

  const stopRecording = () => {
    mediaRecRef.current?.stop()
    setRecording(false)
  }

  const handleSendLocation = () => {
    setShowAttachmentMenu(false)
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    toast.info('Fetching location...')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
        setSending(true)
        try {
          const { data } = await messageAPI.sendMessage({
            chatId,
            content: `📍 My Location:\n${mapsUrl}`,
            messageType: 'TEXT',
            replyToMessageId: replyToMessage?.id,
          })
          addMessage(chatId, data.data)
          onClearReply()
        } catch { toast.error('Failed to send location') }
        finally { setSending(false) }
      },
      () => toast.error('Unable to retrieve your location')
    )
  }

  const handlePlaceholder = (feature) => {
    setShowAttachmentMenu(false)
    toast.info(`${feature} feature coming soon!`)
  }

  const handleSendSpecialMessage = async (type, data) => {
    setSending(true)
    try {
      const { data: responseData } = await messageAPI.sendMessage({
        chatId,
        content: JSON.stringify(data),
        messageType: type,
        replyToMessageId: replyToMessage?.id,
      })
      addMessage(chatId, responseData.data)
      onClearReply()
    } catch {
      toast.error(`Failed to send ${type.toLowerCase()}`)
    } finally {
      setSending(false)
    }
  }

  const handleAiImage = async () => {
    setShowAttachmentMenu(false)
    toast.info('Opening Meta AI...')
    try {
      const { data } = await chatAPI.getOrCreateAiChat()
      setActiveChat(data.data)
      navigate(`/chat/${data.data.id}`)
    } catch {
      toast.error('Failed to open AI chat')
    }
  }

  const attachments = [
    { id: 'document', label: 'Document', color: 'bg-indigo-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, action: () => fileInputDocumentRef.current?.click() },
    { id: 'camera', label: 'Camera', color: 'bg-red-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, action: () => { setShowAttachmentMenu(false); setModalOpen('camera') } },
    { id: 'gallery', label: 'Gallery', color: 'bg-purple-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, action: () => fileInputGalleryRef.current?.click() },
    { id: 'audio', label: 'Audio', color: 'bg-orange-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>, action: () => fileInputAudioRef.current?.click() },
    { id: 'location', label: 'Location', color: 'bg-green-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, action: handleSendLocation },
    { id: 'contact', label: 'Contact', color: 'bg-blue-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, action: () => { setShowAttachmentMenu(false); setModalOpen('contact') } },
    { id: 'poll', label: 'Poll', color: 'bg-yellow-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, action: () => { setShowAttachmentMenu(false); setModalOpen('poll') } },
    { id: 'payment', label: 'Payment', color: 'bg-teal-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, action: () => { setShowAttachmentMenu(false); setModalOpen('payment') } },
    { id: 'event', label: 'Event', color: 'bg-cyan-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, action: () => { setShowAttachmentMenu(false); setModalOpen('event') } },
    { id: 'ai', label: 'AI Image', color: 'bg-gradient-to-r from-pink-500 to-purple-500', icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, action: handleAiImage },
  ]

  return (
    <div className="relative bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-0 z-50 animate-fade-in">
          <EmojiPicker
            theme={darkMode ? 'dark' : 'light'}
            onEmojiClick={(emojiData) => setText(t => t + emojiData.emoji)}
            lazyLoadEmojis
            height={350}
            width={320}
          />
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-full left-4 mb-2 z-50 animate-fade-in attachment-menu">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 grid grid-cols-3 gap-y-6 gap-x-6 w-80 border border-gray-100 dark:border-gray-700">
            {attachments.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.color} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  {item.icon}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        {/* Emoji button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 mb-0.5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>

        {/* File attachment */}
        <button
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 mb-0.5 attachment-btn"
        >
          <svg className={`w-6 h-6 transition-transform duration-200 ${showAttachmentMenu ? '-rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
          </svg>
        </button>

        {/* Hidden File Inputs */}
        <input ref={fileInputDocumentRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" onChange={handleFileChange} />
        <input ref={fileInputGalleryRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
        <input ref={fileInputCameraRef} type="file" className="hidden" accept="image/*,video/*" capture="environment" onChange={handleFileChange} />
        <input ref={fileInputAudioRef} type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />

        {/* Text area */}
        <textarea
          rows={1}
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => setShowEmoji(false)}
          placeholder={recording ? '🎤 Recording…' : 'Type a message'}
          disabled={recording || sending}
          className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-400 rounded-2xl px-4 py-2.5 text-sm resize-none
                     border border-gray-200 dark:border-gray-600
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     max-h-32 overflow-y-auto shadow-sm"
          style={{ minHeight: '40px' }}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
        />

        <div className="flex items-center gap-1 mb-0.5">
          {!text.trim() && (
            <button
              onClick={() => setModalOpen('camera')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              title="Camera"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Send / Voice */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              disabled={sending}
              className="p-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-full flex-shrink-0 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 rotate-45" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          ) : (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-2.5 rounded-full flex-shrink-0 transition-colors shadow-sm
                ${recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'}`}
              title="Hold to record voice"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z"/>
                <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <ContactModal isOpen={modalOpen === 'contact'} onClose={() => setModalOpen(null)} onSend={(data) => handleSendSpecialMessage('CONTACT', data)} />
      <PollModal isOpen={modalOpen === 'poll'} onClose={() => setModalOpen(null)} onSend={(data) => handleSendSpecialMessage('POLL', data)} />
      <PaymentModal isOpen={modalOpen === 'payment'} onClose={() => setModalOpen(null)} onSend={(data) => handleSendSpecialMessage('PAYMENT', data)} />
      {modalOpen === 'event'   && <EventModal   onClose={() => setModalOpen(null)} onSend={(data) => handleSendSpecialMessage('EVENT', data)} />}
      <CameraModal isOpen={modalOpen === 'camera'} onClose={() => setModalOpen(null)} onSend={handleDirectFileSend} />
      {showSchedule && <ScheduleMessageModal text={text} onClose={() => setShowSchedule(false)} onSchedule={handleScheduleSubmit} />}
    </div>
  )
}
