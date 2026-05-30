import { useState, useEffect } from 'react'
import { chatAPI } from '../../services/api'
import { toast } from 'react-toastify'

export default function MessageInfoModal({ message, onClose }) {
  const [info, setInfo] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInfo()
  }, [])

  const fetchInfo = async () => {
    try {
      const { data } = await chatAPI.getMessageInfo(message.id)
      setInfo(data.data)
    } catch (err) {
      toast.error('Failed to load message info')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Message Info</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(message.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Receipts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500 text-sm">Loading...</div>
          ) : info.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">No delivery info available.</div>
          ) : (
            info.map((receipt) => (
              <div key={receipt.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={receipt.userAvatar || `https://ui-avatars.com/api/?name=${receipt.userName}`} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{receipt.userName}</p>
                    {receipt.seenAt && (
                      <p className="text-xs text-blue-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        Read {new Date(receipt.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {!receipt.seenAt && receipt.deliveredAt && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        Delivered {new Date(receipt.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
