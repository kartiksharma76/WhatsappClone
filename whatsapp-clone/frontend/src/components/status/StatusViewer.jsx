import { useState, useEffect, useRef } from 'react'
import { useStatusStore, useAuthStore } from '../../store'
import { toast } from 'react-toastify'
import StatusPrivacyModal from '../modals/StatusPrivacyModal'
import AdvertiseModal from '../modals/AdvertiseModal'
import CameraModal from '../modals/CameraModal'

const MOCK_CHANNELS = [
  { id: 'c1', name: 'WhatsApp Updates', icon: 'https://ui-avatars.com/api/?name=W&background=25D366&color=fff', followers: '150M followers' },
  { id: 'c2', name: 'Netflix', icon: 'https://ui-avatars.com/api/?name=N&background=e50914&color=fff', followers: '32M followers' },
  { id: 'c3', name: 'Real Madrid C.F.', icon: 'https://ui-avatars.com/api/?name=RM&background=blue&color=fff', followers: '45M followers' }
]

const BG_PRESETS = [
  { id: 'teal', value: 'bg-teal-700 text-white font-serif' },
  { id: 'purple', value: 'bg-purple-700 text-white font-sans' },
  { id: 'rose', value: 'bg-rose-700 text-white font-mono' },
  { id: 'slate', value: 'bg-slate-800 text-white font-sans' },
  { id: 'sunset', value: 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 text-white font-sans font-bold' },
  { id: 'ocean', value: 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-serif italic' },
  { id: 'emerald', value: 'bg-gradient-to-tr from-green-600 to-emerald-400 text-white font-sans' },
  { id: 'royal', value: 'bg-gradient-to-tr from-indigo-700 to-purple-600 text-white font-mono' }
]

const parseTextStatus = (status) => {
  if (!status || !status.text) return { text: '', presetClass: 'bg-primary-600 text-white font-sans' };
  try {
    const parsed = JSON.parse(status.text);
    if (parsed && typeof parsed === 'object' && 'text' in parsed) {
      return {
        text: parsed.text,
        presetClass: parsed.presetClass || 'bg-primary-600 text-white font-sans'
      };
    }
  } catch (e) {
    // Not JSON
  }
  return { text: status.text, presetClass: 'bg-primary-600 text-white font-sans' };
};

export default function StatusViewer() {
  const { statuses, isLoading, fetchStatuses, createStatus, markAsViewed, deleteStatus } = useStatusStore()
  const { user } = useAuthStore()
  const [showUpload, setShowUpload] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [textStatus, setTextStatus] = useState('')
  const [file, setFile] = useState(null)
  
  const handleCameraCapture = (capturedFile) => {
    setFile(capturedFile)
    setShowCamera(false)
    setShowUpload(true)
  }
  
  // Sequential viewer states
  const [viewingGroup, setViewingGroup] = useState(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [selectedBgIndex, setSelectedBgIndex] = useState(0)
  const [showViewersList, setShowViewersList] = useState(false)
  
  const [showMenu, setShowMenu] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showAdvertise, setShowAdvertise] = useState(false)

  const activeStatus = viewingGroup ? viewingGroup.statuses[activeStoryIndex] : null
  const videoRef = useRef(null)

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  // Auto-advance for image/text statuses
  useEffect(() => {
    if (!viewingGroup || !activeStatus) return
    if (activeStatus.type === 'VIDEO') return
    if (showViewersList) return

    setProgress(0)
    const duration = 5000 // 5 seconds
    const step = 50 // update every 50ms
    const increment = (step / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          handleNext()
          return 100
        }
        return prev + increment
      })
    }, step)

    return () => clearInterval(timer)
  }, [viewingGroup, activeStoryIndex, showViewersList])

  // Play/pause video when viewers list is toggled
  useEffect(() => {
    if (videoRef.current) {
      if (showViewersList) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [showViewersList])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewingGroup) return
      if (e.key === 'Escape') {
        closeViewer()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewingGroup, activeStoryIndex])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!textStatus.trim() && !file) return

    const formData = new FormData()
    if (file) {
      formData.append('file', file)
      if (textStatus.trim()) formData.append('text', textStatus)
    } else {
      const payloadText = JSON.stringify({
        text: textStatus,
        presetClass: BG_PRESETS[selectedBgIndex].value
      })
      formData.append('text', payloadText)
    }

    try {
      await createStatus(formData)
      setShowUpload(false)
      setTextStatus('')
      setFile(null)
      setSelectedBgIndex(0)
      toast.success('Status updated!')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleView = (statusGroup) => {
    const unviewedIndex = statusGroup.statuses.findIndex(s => !s.viewed)
    const startIndex = unviewedIndex !== -1 ? unviewedIndex : 0
    
    setViewingGroup(statusGroup)
    setActiveStoryIndex(startIndex)
    setProgress(0)
    
    const firstStatus = statusGroup.statuses[startIndex]
    if (!firstStatus.viewed && firstStatus.user.id !== user.id) {
      markAsViewed(firstStatus.id)
    }
  }

  const handleDelete = async (statusId) => {
    try {
      await deleteStatus(statusId)
      toast.success('Status deleted')
      
      if (viewingGroup) {
        const remaining = viewingGroup.statuses.filter(s => s.id !== statusId)
        if (remaining.length > 0) {
          const updatedGroup = { ...viewingGroup, statuses: remaining }
          setViewingGroup(updatedGroup)
          if (activeStoryIndex >= remaining.length) {
            setActiveStoryIndex(remaining.length - 1)
          }
          setProgress(0)
        } else {
          closeViewer()
        }
      }
    } catch (err) {
      toast.error('Failed to delete status')
    }
  }

  const handleNext = () => {
    if (!viewingGroup) return
    const nextIndex = activeStoryIndex + 1
    if (nextIndex < viewingGroup.statuses.length) {
      setActiveStoryIndex(nextIndex)
      setProgress(0)
      const nextStatus = viewingGroup.statuses[nextIndex]
      if (!nextStatus.viewed && nextStatus.user.id !== user.id) {
        markAsViewed(nextStatus.id)
      }
    } else {
      const allGroups = otherStatusGroups
      if (viewingGroup.user.id === user?.id) {
        if (allGroups.length > 0) {
          handleView(allGroups[0])
        } else {
          closeViewer()
        }
      } else {
        const currentGroupIndex = allGroups.findIndex(g => g.user.id === viewingGroup.user.id)
        if (currentGroupIndex !== -1 && currentGroupIndex + 1 < allGroups.length) {
          handleView(allGroups[currentGroupIndex + 1])
        } else {
          closeViewer()
        }
      }
    }
  }

  const handlePrev = () => {
    if (!viewingGroup) return
    const prevIndex = activeStoryIndex - 1
    if (prevIndex >= 0) {
      setActiveStoryIndex(prevIndex)
      setProgress(0)
      const prevStatus = viewingGroup.statuses[prevIndex]
      if (!prevStatus.viewed && prevStatus.user.id !== user.id) {
        markAsViewed(prevStatus.id)
      }
    } else {
      const allGroups = otherStatusGroups
      if (viewingGroup.user.id === user?.id) {
        closeViewer()
      } else {
        const currentGroupIndex = allGroups.findIndex(g => g.user.id === viewingGroup.user.id)
        if (currentGroupIndex > 0) {
          const prevGroup = allGroups[currentGroupIndex - 1]
          setViewingGroup(prevGroup)
          setActiveStoryIndex(prevGroup.statuses.length - 1)
          setProgress(0)
          const lastStatus = prevGroup.statuses[prevGroup.statuses.length - 1]
          if (!lastStatus.viewed && lastStatus.user.id !== user.id) {
            markAsViewed(lastStatus.id)
          }
        } else if (currentGroupIndex === 0 && myStatusGroup) {
          setViewingGroup(myStatusGroup)
          setActiveStoryIndex(myStatusGroup.statuses.length - 1)
          setProgress(0)
        } else {
          closeViewer()
        }
      }
    }
  }

  const closeViewer = () => {
    setViewingGroup(null)
    setActiveStoryIndex(0)
    setProgress(0)
    setShowViewersList(false)
  }

  const handleVideoTimeUpdate = (e) => {
    const video = e.target
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100)
    }
  }

  const handleVideoEnded = () => {
    handleNext()
  }

  // Group statuses by user
  const groupedStatuses = statuses.reduce((acc, status) => {
    const userId = status.user.id
    if (!acc[userId]) {
      acc[userId] = { user: status.user, statuses: [] }
    }
    acc[userId].statuses.push(status)
    return acc
  }, {})

  const myStatusGroup = groupedStatuses[user?.id]
  const otherStatusGroups = Object.values(groupedStatuses).filter(g => g.user.id !== user?.id)

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 select-none">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Updates</h2>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-full transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <button onClick={() => { setShowPrivacy(true); setShowMenu(false) }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
                Status privacy
              </button>
              <button onClick={() => { setShowAdvertise(true); setShowMenu(false) }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
                Create ad
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowCamera(true)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
              <button onClick={() => setShowUpload(true)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
            </div>
          </div>
          
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">Loading updates...</div>
        ) : (
          <>
            {/* My Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">My Status</h3>
              <div 
                className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                onClick={() => myStatusGroup ? handleView(myStatusGroup) : setShowUpload(true)}
              >
                <div className="relative">
                  <img 
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.fullName}`}
                    className={`w-14 h-14 rounded-full border-2 p-0.5 object-cover ${myStatusGroup ? 'border-primary-500' : 'border-gray-300'}`}
                  />
                  {!myStatusGroup && (
                    <div className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-800 dark:text-white">My status</p>
                  <p className="text-sm text-gray-500">{myStatusGroup ? 'Tap to view updates' : 'Tap to add status update'}</p>
                </div>
              </div>
            </div>

            {/* Recent Updates */}
            {otherStatusGroups.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Recent updates</h3>
                <div className="space-y-2">
                  {otherStatusGroups.map(group => {
                    const allViewed = group.statuses.every(s => s.viewed)
                    return (
                      <div 
                        key={group.user.id}
                        className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                        onClick={() => handleView(group)}
                      >
                        <img 
                          src={group.user.profilePicture || `https://ui-avatars.com/api/?name=${group.user.fullName}`}
                          className={`w-14 h-14 rounded-full border-2 p-0.5 object-cover ${allViewed ? 'border-gray-300' : 'border-primary-500'}`}
                        />
                        <div className="ml-4">
                          <p className="font-semibold text-gray-800 dark:text-white">{group.user.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(group.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm mt-8">No recent updates</p>
            )}
          </>
        )}
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

        {/* Channels Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Channels</h3>
            <button className="text-sm text-primary-600 font-medium hover:underline">Explore</button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Stay updated on topics that matter to you. Find channels to follow below.</p>
          
          <div className="space-y-3">
            {MOCK_CHANNELS.map(channel => (
              <div key={channel.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <img src={channel.icon} alt={channel.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{channel.name}</p>
                    <p className="text-xs text-gray-500">{channel.followers}</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold text-sm rounded-full hover:bg-primary-100 transition">
                  Follow
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Find channels
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Status</h3>
            <form onSubmit={handleUpload}>
              <textarea 
                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 mb-4 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type a status..."
                rows={3}
                value={textStatus}
                onChange={e => setTextStatus(e.target.value)}
              />
              
              {!file && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Style</label>
                  <div className="flex flex-wrap gap-2">
                    {BG_PRESETS.map((preset, index) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedBgIndex(index)}
                        className={`w-8 h-8 rounded-full border-2 ${preset.value.split(' ')[0]} ${
                          selectedBgIndex === index ? 'border-primary-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        } transition`}
                        title={preset.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attach Media (Image/Video)</label>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={e => setFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={!textStatus.trim() && !file} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {viewingGroup && activeStatus && (() => {
        const parsed = parseTextStatus(activeStatus);
        return (
          <div className="fixed inset-0 bg-black z-[70] flex flex-col select-none">
            {/* Progress Indicator Bars */}
            <div className="absolute top-3 left-0 right-0 px-4 flex gap-1.5 z-[72]">
              {viewingGroup.statuses.map((status, index) => {
                let width = '0%'
                if (index < activeStoryIndex) width = '100%'
                else if (index === activeStoryIndex) width = `${progress}%`

                return (
                  <div key={status.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-75 ease-out" 
                      style={{ width }} 
                    />
                  </div>
                )
              })}
            </div>

            {/* Header info */}
            <div className="flex justify-between items-center p-4 pt-6 text-white z-[71] bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-3">
                <img src={viewingGroup.user.profilePicture || `https://ui-avatars.com/api/?name=${viewingGroup.user.fullName}`} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                <div>
                  <p className="font-semibold">{viewingGroup.user.fullName}</p>
                  <p className="text-xs opacity-75">{new Date(activeStatus.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {activeStatus.user.id === user?.id && (
                  <button onClick={() => handleDelete(activeStatus.id)} className="p-2 hover:bg-white/25 rounded-full text-red-400 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                )}
                <button onClick={closeViewer} className="p-2 hover:bg-white/25 rounded-full transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            
            {/* Main view content */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Left/Right Tap Zones */}
              <div className="absolute inset-0 flex">
                <div 
                  className="w-[35%] h-full cursor-pointer z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                />
                <div className="w-[30%] h-full" />
                <div 
                  className="w-[35%] h-full cursor-pointer z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                />
              </div>

              {/* Left/Right Arrow Buttons (Desktop) */}
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev() }} 
                className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext() }} 
                className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
              </button>

              {activeStatus.type === 'IMAGE' && (
                <img src={`/api${activeStatus.mediaUrl}`} className="max-w-full max-h-full object-contain" />
              )}
              {activeStatus.type === 'VIDEO' && (
                <video 
                  ref={videoRef}
                  src={`/api${activeStatus.mediaUrl}`} 
                  autoPlay 
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  className="max-w-full max-h-full" 
                />
              )}
              {activeStatus.type === 'TEXT' && (
                <div className={`absolute inset-0 flex items-center justify-center p-8 ${parsed.presetClass} text-white text-3xl font-medium text-center`}>
                  <p className="max-w-xl break-words leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                </div>
              )}
              {activeStatus.type !== 'TEXT' && activeStatus.text && (
                <div className="absolute bottom-24 left-0 right-0 px-4 py-3 bg-black/50 text-white text-center text-lg z-20 max-w-2xl mx-auto rounded-xl">
                  {activeStatus.text}
                </div>
              )}
            </div>

            {/* Viewers list trigger button */}
            {activeStatus.user.id === user?.id && activeStatus.viewedBy && (
              <div 
                onClick={() => setShowViewersList(true)}
                className="p-4 pb-6 text-center text-white/80 bg-gradient-to-t from-black/80 to-transparent cursor-pointer hover:text-white transition z-20 relative flex flex-col items-center justify-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <p className="text-sm font-medium">{activeStatus.viewedBy.length} Views</p>
                <span className="text-xs opacity-75">Swipe up or tap to see who</span>
              </div>
            )}

            {/* Viewers list bottom drawer */}
            {showViewersList && (
              <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-800 rounded-t-3xl max-h-[50%] flex flex-col z-[80] animate-slide-up text-gray-800 dark:text-white shadow-2xl">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h4 className="font-bold text-lg">Viewed by ({activeStatus.viewedBy.length})</h4>
                  <button 
                    onClick={() => setShowViewersList(false)}
                    className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeStatus.viewedBy.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No views yet</p>
                  ) : (
                    activeStatus.viewedBy.map(viewerUser => (
                      <div key={viewerUser.id} className="flex items-center gap-3">
                        <img 
                          src={viewerUser.profilePicture || `https://ui-avatars.com/api/?name=${viewerUser.fullName}`} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                        />
                        <p className="font-semibold">{viewerUser.fullName}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {showPrivacy && <StatusPrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showAdvertise && <AdvertiseModal onClose={() => setShowAdvertise(false)} />}
      <CameraModal isOpen={showCamera} onClose={() => setShowCamera(false)} onSend={handleCameraCapture} />
    </div>
  )
}
