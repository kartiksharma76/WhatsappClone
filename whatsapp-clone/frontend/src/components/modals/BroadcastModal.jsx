import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { userAPI, messageAPI } from '../../services/api'
import { useChatStore } from '../../store'
import { Modal, Spinner } from './NewChatModal'

export default function BroadcastModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
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
    finally { setLoading(false) }
  }

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleBroadcast = async () => {
    if (selectedUsers.length === 0) return toast.error('Select at least one user')
    if (!message.trim()) return toast.error('Enter a message to broadcast')
    
    setSending(true)
    try {
      // Create broadcast request using a new API endpoint we'll need to add
      await messageAPI.broadcastMessage({
        content: message.trim(),
        targetUserIds: selectedUsers.map(u => u.id)
      })
      toast.success(`Message broadcasted to ${selectedUsers.length} users!`)
      onClose()
    } catch (err) {
      toast.error('Failed to broadcast message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal title="New Broadcast" onClose={onClose}>
      <div className="space-y-4">
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-24 overflow-y-auto">
            {selectedUsers.map(u => (
              <span key={u.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                {u.fullName}
                <button onClick={() => toggleUser(u)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400">
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search recipients..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto h-48 border border-gray-100 dark:border-gray-700 rounded-xl">
          {loading && <div className="flex justify-center py-4"><Spinner /></div>}
          {!loading && users.map(user => {
            const isSelected = selectedUsers.some(u => u.id === user.id)
            return (
              <button
                key={user.id}
                onClick={() => toggleUser(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center
                  ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-500'}`}>
                  {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.fullName}`} alt="" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium dark:text-gray-200">{user.fullName}</span>
              </button>
            )
          })}
        </div>

        {/* Message Input */}
        <div>
          <textarea
            rows="3"
            placeholder="Type your broadcast message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleBroadcast}
          disabled={sending || selectedUsers.length === 0 || !message.trim()}
          className="w-full py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex justify-center items-center disabled:opacity-50"
        >
          {sending ? <Spinner size={5} /> : `Broadcast to ${selectedUsers.length} recipients`}
        </button>
      </div>
    </Modal>
  )
}
