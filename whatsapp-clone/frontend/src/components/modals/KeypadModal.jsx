import { useState } from 'react'
import { toast } from 'react-toastify'

export default function KeypadModal({ onClose }) {
  const [number, setNumber] = useState('')

  const handleDial = (digit) => {
    setNumber(prev => prev + digit)
  }

  const handleDelete = () => {
    setNumber(prev => prev.slice(0, -1))
  }

  const handleCall = (video = false) => {
    if (!number) return
    toast.info(`Calling ${number}...`)
    setTimeout(() => {
      toast.error('Call failed. This number is not registered on ChatApp.')
      onClose()
    }, 2000)
  }

  const DIAL_PAD = [
    { num: '1', sub: '' }, { num: '2', sub: 'ABC' }, { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' }, { num: '5', sub: 'JKL' }, { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' }, { num: '8', sub: 'TUV' }, { num: '9', sub: 'WXYZ' },
    { num: '*', sub: '' }, { num: '0', sub: '+' }, { num: '#', sub: '' }
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-[320px] shadow-2xl overflow-hidden flex flex-col items-center p-6">
        <div className="w-full flex justify-end mb-4">
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="w-full h-16 flex items-center justify-center mb-6 relative">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-widest truncate max-w-[200px]">
            {number || <span className="text-gray-300 dark:text-gray-600">Enter Number</span>}
          </h2>
          {number && (
            <button onClick={handleDelete} className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/></svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {DIAL_PAD.map((btn, i) => (
            <button 
              key={i} 
              onClick={() => handleDial(btn.num)}
              className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex flex-col items-center justify-center transition-colors active:bg-gray-300 dark:active:bg-gray-500"
            >
              <span className="text-2xl font-medium text-gray-900 dark:text-white">{btn.num}</span>
              {btn.sub && <span className="text-[10px] font-bold text-gray-500 tracking-widest">{btn.sub}</span>}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => handleCall(false)}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg shadow-green-500/30"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.03 21c.76 0 .98-.66.98-1.19v-3.44c0-.54-.45-.99-.99-.99z"/></svg>
          </button>
          <button 
            onClick={() => handleCall(true)}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg shadow-green-500/30"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
