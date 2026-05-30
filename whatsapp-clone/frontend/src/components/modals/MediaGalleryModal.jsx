import { useState, useEffect } from 'react'
import { messageAPI } from '../../services/api'
import { toast } from 'react-toastify'

export default function MediaGalleryModal({ chatId, onClose }) {
  const [mediaMessages, setMediaMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [tab, setTab] = useState('MEDIA') // MEDIA, DOCS
  
  useEffect(() => {
    loadMedia(0, true)
  }, [chatId])

  const loadMedia = async (pageNum, reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const { data } = await messageAPI.getMediaMessages(chatId, pageNum)
      const content = data.data?.content || []
      const totalPages = data.data?.totalPages || 0
      
      if (reset) {
        setMediaMessages(content)
      } else {
        setMediaMessages(prev => [...prev, ...content])
      }
      setHasMore(pageNum < totalPages - 1)
      setPage(pageNum)
    } catch {
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  // Filter media based on tab
  const filteredMedia = mediaMessages.filter(m => {
    if (tab === 'MEDIA') return ['IMAGE', 'VIDEO'].includes(m.messageType)
    if (tab === 'DOCS') return ['FILE', 'AUDIO', 'DOCUMENT'].includes(m.messageType)
    return false
  })

  return (
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-gray-900 animate-fade-in flex-col h-full w-full">
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Media, Links and Docs</h2>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {['MEDIA', 'DOCS'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${tab === t
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 dark:text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
        {tab === 'MEDIA' && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {filteredMedia.map(m => (
              <div key={m.id} className="relative aspect-square bg-gray-200 dark:bg-gray-800 overflow-hidden group cursor-pointer hover:opacity-90">
                {m.messageType === 'IMAGE' ? (
                  <img src={m.fileUrl} alt="media" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video src={m.fileUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'DOCS' && (
          <div className="flex flex-col gap-2">
            {filteredMedia.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.fileName || 'Document'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(m.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <a href={m.fileUrl} download className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </a>
              </div>
            ))}
          </div>
        )}

        {filteredMedia.length === 0 && !loading && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            No {tab.toLowerCase()} shared in this chat
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-6 mb-4">
            <button onClick={() => loadMedia(page + 1)} className="px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-primary-600 dark:text-primary-400 rounded-full shadow-sm hover:shadow transition-shadow">
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
