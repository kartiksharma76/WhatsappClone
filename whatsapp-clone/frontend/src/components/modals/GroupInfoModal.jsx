import { useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { chatAPI, userAPI } from '../../services/api'
import { useChatStore, useAuthStore } from '../../store'
import { Modal, Spinner } from './NewChatModal'

export default function GroupInfoModal({ chatInfo, onClose }) {
  const { user } = useAuthStore()
  const { setChats, chats, activeChatId, setActiveChat } = useChatStore()
  
  const [groupName, setGroupName] = useState(chatInfo.name)
  const [description, setDescription] = useState(chatInfo.about || '')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  const timerRef = useRef(null)

  const isAdmin = chatInfo.admins?.some(a => a.id === user?.id)
  
  const handleSave = async () => {
    if (!groupName.trim()) return toast.error('Group name required')
    setLoading(true)
    try {
      const { data } = await chatAPI.updateGroupInfo(chatInfo.id, {
        groupName: groupName.trim(),
        groupDescription: description.trim()
      })
      setChats(chats.map(c => c.id === chatInfo.id ? data.data : c))
      toast.success('Group updated')
      onClose()
    } catch (err) {
      toast.error('Failed to update group')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timerRef.current)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await userAPI.searchUsers(q)
        setSearchResults(data.data?.content || [])
      } catch {
        toast.error('Search failed')
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const addParticipant = async (newUserId) => {
    try {
      await chatAPI.addGroupParticipants(chatInfo.id, { userIds: [newUserId] })
      toast.success('Participant added')
      // Refresh chat list or we can just fetch chat again.
      // Ideally we should reload the active chat
      const { data } = await chatAPI.getChat(chatInfo.id)
      setChats(chats.map(c => c.id === chatInfo.id ? data.data : c))
      setQuery('')
      setSearchResults([])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add participant')
    }
  }

  const removeParticipant = async (participantId) => {
    if (!window.confirm("Remove this user?")) return
    try {
      await chatAPI.removeGroupParticipant(chatInfo.id, participantId)
      toast.success('Participant removed')
      const { data } = await chatAPI.getChat(chatInfo.id)
      setChats(chats.map(c => c.id === chatInfo.id ? data.data : c))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove participant')
    }
  }

  return (
    <Modal title="Group Info" onClose={onClose}>
      <div className="space-y-4">
        {/* Info Edit Section */}
        {isAdmin ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 flex justify-center items-center"
            >
              {loading ? <Spinner size={4} /> : 'Save Changes'}
            </button>
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-center">
            <h3 className="font-semibold text-lg">{chatInfo.name}</h3>
            {chatInfo.about && <p className="text-sm text-gray-500 mt-1">{chatInfo.about}</p>}
          </div>
        )}

        {/* Invite Link Section */}
        {isAdmin && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invite Link</label>
              <button
                onClick={async () => {
                  try {
                    const { data } = await chatAPI.generateInviteToken(chatInfo.id);
                    const inviteUrl = `${window.location.origin}/join/${data.data}`;
                    await navigator.clipboard.writeText(inviteUrl);
                    toast.success('Invite link copied to clipboard!');
                  } catch (err) {
                    toast.error('Failed to generate link');
                  }
                }}
                className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
              >
                Copy Link
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Anyone with this link can join the group.</p>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm font-semibold mb-2">Participants ({chatInfo.participants?.length || 0})</p>
          
          {/* Add Participant Search */}
          {isAdmin && (
            <div className="mb-3 relative">
              <input
                type="text"
                placeholder="Search to add participants..."
                value={query}
                onChange={handleSearch}
                className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10">
                  {searchResults.map(u => {
                    const isAlreadyIn = chatInfo.participants.some(p => p.id === u.id)
                    return (
                      <button
                        key={u.id}
                        disabled={isAlreadyIn}
                        onClick={() => addParticipant(u.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center ${isAlreadyIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <span>{u.fullName}</span>
                        {isAlreadyIn && <span className="text-xs text-gray-500">Joined</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* List of participants */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {chatInfo.participants?.map(p => {
              const pIsAdmin = chatInfo.admins?.some(a => a.id === p.id)
              return (
                <div key={p.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={p.profilePicture || `https://ui-avatars.com/api/?name=${p.fullName}`} className="w-8 h-8 rounded-full" alt="avatar" />
                    <div>
                      <p className="text-sm font-medium">{p.fullName} {p.id === user?.id && '(You)'}</p>
                      {pIsAdmin && <span className="text-xs text-primary-500 font-semibold">Admin</span>}
                    </div>
                  </div>
                  {isAdmin && p.id !== user?.id && (
                    <button onClick={() => removeParticipant(p.id)} className="text-red-500 hover:text-red-600 text-sm">
                      Remove
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
