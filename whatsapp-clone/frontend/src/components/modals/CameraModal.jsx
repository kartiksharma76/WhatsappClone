import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'

export default function CameraModal({ isOpen, onClose, onSend }) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState([])
  const [mode, setMode] = useState('photo') // 'photo' or 'video'
  const [previewUrl, setPreviewUrl] = useState(null)
  const [capturedFile, setCapturedFile] = useState(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      resetState()
    }
    return () => stopCamera()
  }, [isOpen, mode])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: mode === 'video'
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      toast.error('Could not access camera/microphone')
      onClose()
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const resetState = () => {
    setPreviewUrl(null)
    setCapturedFile(null)
    setRecordedChunks([])
    setIsRecording(false)
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }

  const handleCapturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
      setCapturedFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)
  }

  const handleStartRecording = () => {
    if (!stream) return
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8,opus' })
    mediaRecorderRef.current = mediaRecorder
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data])
      }
    }
    
    mediaRecorder.onstop = () => {
      // The onstop event might fire before the last ondataavailable.
      // However, we'll construct the blob in a useEffect or handle it after short delay
    }

    mediaRecorder.start()
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Handle building the video blob once chunks are ready
  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const file = new File([blob], 'video.webm', { type: 'video/webm' })
      setCapturedFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
      setRecordedChunks([]) // Reset chunks for next time
    }
  }, [isRecording, recordedChunks])


  const handleSend = () => {
    if (capturedFile) {
      onSend(capturedFile)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in">
      <div className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {!previewUrl && (
            <div className="flex bg-black/50 rounded-full p-1 border border-white/20 backdrop-blur-md">
              <button 
                onClick={() => setMode('photo')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'photo' ? 'bg-white text-black' : 'text-white'}`}
              >
                Photo
              </button>
              <button 
                onClick={() => setMode('video')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'video' ? 'bg-white text-black' : 'text-white'}`}
              >
                Video
              </button>
            </div>
          )}
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        {/* Viewfinder / Preview */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {!previewUrl ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted={mode === 'video'} // Only mute if video, though usually we mute local playback anyway
              className="w-full h-full object-contain"
            />
          ) : (
            mode === 'photo' ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <video src={previewUrl} controls autoPlay className="w-full h-full object-contain" />
            )
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-16 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Recording...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-black flex justify-center items-center h-32">
          {!previewUrl ? (
            mode === 'photo' ? (
              <button 
                onClick={handleCapturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 bg-white rounded-full"></div>
              </button>
            ) : (
              <button 
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`transition-all bg-red-500 ${isRecording ? 'w-8 h-8 rounded-sm' : 'w-14 h-14 rounded-full'}`}></div>
              </button>
            )
          ) : (
            <div className="flex items-center gap-8 w-full px-8">
              <button 
                onClick={resetState}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                Retake
              </button>
              <button 
                onClick={handleSend}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                Send
                <svg className="w-5 h-5 rotate-45" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
