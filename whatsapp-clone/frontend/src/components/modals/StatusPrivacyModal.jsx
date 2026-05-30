import { useState } from 'react'

export default function StatusPrivacyModal({ onClose }) {
  const [privacy, setPrivacy] = useState(localStorage.getItem('status_privacy') || 'contacts')

  const handleSave = () => {
    localStorage.setItem('status_privacy', privacy)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Status Privacy</h3>
        <p className="text-sm text-gray-500 mb-4">Who can see my status updates</p>
        
        <div className="space-y-3 mb-6 text-gray-800 dark:text-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" checked={privacy === 'contacts'} onChange={() => setPrivacy('contacts')} className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
            <span>My contacts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" checked={privacy === 'except'} onChange={() => setPrivacy('except')} className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
            <span>My contacts except...</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" checked={privacy === 'only'} onChange={() => setPrivacy('only')} className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
            <span>Only share with...</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition">Save</button>
        </div>
      </div>
    </div>
  )
}
