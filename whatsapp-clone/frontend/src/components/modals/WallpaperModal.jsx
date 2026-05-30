import { useState } from 'react'

export const DEFAULT_WALLPAPERS = [
  { id: 'default', color: '#efeae2', name: 'Default Light' },
  { id: 'dark', color: '#0b141a', name: 'Default Dark' },
  { id: 'green', color: '#dcf8c6', name: 'WhatsApp Green' },
  { id: 'blue', color: '#e6f2ff', name: 'Soft Blue' },
  { id: 'pink', color: '#ffe6f2', name: 'Soft Pink' },
  { id: 'img1', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80', name: 'Gradient 1' },
  { id: 'img2', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=800&q=80', name: 'Gradient 2' },
  { id: 'img3', url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80', name: 'Nature' },
]

export default function WallpaperModal({ chatId, onClose }) {
  const [selected, setSelected] = useState(
    localStorage.getItem(`wallpaper_${chatId}`) || 'default'
  )

  const handleSave = () => {
    localStorage.setItem(`wallpaper_${chatId}`, selected)
    // Trigger a custom event so ChatWindow can pick up the change immediately
    window.dispatchEvent(new CustomEvent('wallpaperChanged', { detail: { chatId, wallpaper: selected } }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chat Wallpaper</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            {DEFAULT_WALLPAPERS.map(wp => (
              <div 
                key={wp.id}
                onClick={() => setSelected(wp.id)}
                className={`relative h-32 rounded-xl cursor-pointer overflow-hidden border-2 transition-all ${selected === wp.id ? 'border-primary-500 scale-105 shadow-md' : 'border-transparent hover:scale-105'}`}
                style={wp.color ? { backgroundColor: wp.color } : { backgroundImage: `url(${wp.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                  <span className="text-white text-xs font-medium text-shadow">{wp.name}</span>
                </div>
                {selected === wp.id && (
                  <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1 shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
            Set Wallpaper
          </button>
        </div>
      </div>
    </div>
  )
}
