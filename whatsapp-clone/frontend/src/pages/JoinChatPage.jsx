import { useEffect, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { chatAPI } from '../services/api'
import { useChatStore } from '../store'
import { Spinner } from '../components/modals/NewChatModal'

export default function JoinChatPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setActiveChat, setChats, chats } = useChatStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function joinChat() {
      try {
        const { data } = await chatAPI.joinWithInviteToken(token)
        const chat = data.data
        const exists = chats.find(c => c.id === chat.id)
        if (!exists) setChats([chat, ...chats])
        setActiveChat(chat.id)
        toast.success(`Joined group: ${chat.name}`)
        navigate('/')
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to join group via invite link')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    if (token) joinChat()
    else setLoading(false)
  }, [token, navigate, setActiveChat, setChats, chats])

  if (!loading) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={10} />
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Joining group...</p>
      </div>
    </div>
  )
}
