import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { messageAPI } from '../../services/api'
import { Modal, Spinner } from './NewChatModal'
import { format } from 'date-fns'

export default function StarredMessagesModal({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStarred()
  }, [])

  async function fetchStarred() {
    setLoading(true)
    try {
      const { data } = await messageAPI.getStarred(0)
      setMessages(data.data?.content || [])
    } catch {
      toast.error('Could not fetch starred messages')
    } finally {
      setLoading(false)
    }
  }

  async function unstarMessage(id) {
    try {
      await messageAPI.unstarMessage(id)
      setMessages(messages.filter(m => m.id !== id))
      toast.success('Message unstarred')
    } catch {
      toast.error('Failed to unstar message')
    }
  }

  return (
    <Modal title="Starred Messages" onClose={onClose}>
      <div className="overflow-y-auto max-h-96 space-y-3">
        {loading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">No starred messages</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl relative group">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-xs font-semibold text-primary-500">{msg.sender?.fullName}</p>
                <p className="text-xs text-gray-400">
                  {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : ''}
                </p>
              </div>
              <button 
                onClick={() => unstarMessage(msg.id)}
                className="text-gray-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Unstar"
              >
                <svg className="w-4 h-4 fill-current text-yellow-500" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            </div>
            
            {msg.messageType === 'IMAGE' ? (
              <img src={msg.fileUrl} alt="Starred" className="max-w-full h-auto rounded mt-1" />
            ) : msg.messageType === 'VOICE' || msg.messageType === 'AUDIO' ? (
              <audio controls src={msg.fileUrl} className="mt-1 w-full max-w-[200px]" />
            ) : msg.messageType === 'FILE' ? (
              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm mt-1 block">
                📎 {msg.fileName || 'File'}
              </a>
            ) : (
              <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
