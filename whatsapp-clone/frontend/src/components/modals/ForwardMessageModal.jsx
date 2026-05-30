import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { messageAPI } from '../../services/api'
import { useChatStore, useAuthStore } from '../../store'
import { Modal } from './NewChatModal'

export default function ForwardMessageModal({ message, onClose }) {
  const { chats } = useChatStore()
  const { user } = useAuthStore()
  const [selectedChatIds, setSelectedChatIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(query.toLowerCase()) || 
    chat.participants?.some(p => p.fullName.toLowerCase().includes(query.toLowerCase()))
  )

  function toggleSelect(id) {
    if (selectedChatIds.includes(id)) {
      setSelectedChatIds(selectedChatIds.filter(cid => cid !== id))
    } else {
      setSelectedChatIds([...selectedChatIds, id])
    }
  }

  async function handleForward() {
    if (selectedChatIds.length === 0) return
    setLoading(true)
    try {
      await messageAPI.forwardMessage(message.id, selectedChatIds)
      toast.success('Message forwarded')
      onClose()
    } catch {
      toast.error('Could not forward message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      title="Forward Message" 
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button 
            onClick={handleForward}
            disabled={selectedChatIds.length === 0 || loading}
            className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Forwarding...' : `Forward to ${selectedChatIds.length} chat(s)`}
          </button>
        </div>
      }
    >
      <div className="relative mb-3">
        <input
          autoFocus
          type="text"
          placeholder="Search chats..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="overflow-y-auto max-h-72 space-y-1">
        {filteredChats.map(chat => {
          // get chat name or participant name
          let chatName = chat.name
          let avatar = null
          if (!chatName && chat.chatType === 'PRIVATE') {
            const other = chat.participants?.find(p => p.id !== user?.id)
            if (other) {
              chatName = other.fullName
              avatar = other.profilePicture
            }
          }
          if (!chatName) chatName = 'Unknown Chat'

          return (
            <div 
              key={chat.id} 
              onClick={() => toggleSelect(chat.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=22c55e&color=fff&size=40`}
                  alt={chatName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{chatName}</p>
              </div>
              <input 
                type="checkbox" 
                checked={selectedChatIds.includes(chat.id)} 
                onChange={() => {}} 
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
            </div>
          )
        })}
        {filteredChats.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">No chats found</p>
        )}
      </div>
    </Modal>
  )
}
