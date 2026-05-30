import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { userAPI, chatAPI } from '../../services/api'
import { useChatStore } from '../../store'
import { Modal, Spinner } from './NewChatModal'

export default function NewGroupModal({ onClose }) {
  const [step,         setStep]         = useState(1) // 1=pick members, 2=name+icon
  const [query,        setQuery]        = useState('')
  const [users,        setUsers]        = useState([])
  const [selected,     setSelected]     = useState([])
  const [groupName,    setGroupName]    = useState('')
  const [description,  setDescription]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [creating,     setCreating]     = useState(false)
  const { setActiveChat, setChats, chats } = useChatStore()
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query.trim()) { setUsers([]); return }
    timerRef.current = setTimeout(() => search(query), 350)
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

  function toggleSelect(user) {
    setSelected(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    )
  }

  async function createGroup() {
    if (!groupName.trim()) { toast.error('Group name is required'); return }
    if (selected.length < 1) { toast.error('Add at least 1 participant'); return }
    setCreating(true)
    try {
      const { data } = await chatAPI.createGroup({
        groupName:    groupName.trim(),
        groupDescription: description.trim(),
        participantIds: selected.map(u => u.id),
      })
      const chat = data.data
      setChats([chat, ...chats])
      setActiveChat(chat.id)
      toast.success(`Group "${groupName}" created`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      title={step === 1 ? 'Add Participants' : 'New Group'}
      onClose={onClose}
      footer={
        step === 1 ? (
          <button
            disabled={selected.length === 0}
            onClick={() => setStep(2)}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50
                       text-white font-semibold rounded-xl transition-colors"
          >
            Next ({selected.length} selected)
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600
                         text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
              Back
            </button>
            <button onClick={createGroup} disabled={creating}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50
                         text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              {creating ? <Spinner size={4} /> : null}
              Create Group
            </button>
          </div>
        )
      }
    >
      {step === 1 && (
        <div className="space-y-3">
          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              {selected.map(u => (
                <span key={u.id}
                  className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30
                             text-primary-700 dark:text-primary-300 text-xs rounded-full pl-2 pr-1 py-1">
                  {u.fullName}
                  <button onClick={() => toggleSelect(u)}
                    className="w-4 h-4 rounded-full bg-primary-200 dark:bg-primary-700
                               flex items-center justify-center hover:bg-primary-300">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <input
            autoFocus
            type="text"
            placeholder="Search users…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                       bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {/* Results */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {loading && <div className="flex justify-center py-4"><Spinner /></div>}
            {users.map(user => {
              const isSelected = selected.some(u => u.id === user.id)
              return (
                <button key={user.id} onClick={() => toggleSelect(user)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left
                    ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <img
                    src={user.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=6366f1&color=fff&size=40`}
                    alt={user.fullName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.phone}</p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {/* Group avatar placeholder */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30
                            flex items-center justify-center text-4xl cursor-pointer
                            hover:bg-primary-200 transition-colors">
              👥
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              type="text"
              maxLength={100}
              placeholder="Enter group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="What's this group about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Members summary */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Members ({selected.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selected.map(u => (
                <span key={u.id}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                             rounded-full px-2.5 py-1">
                  {u.fullName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
