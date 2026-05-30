import { useState } from 'react'
import { toast } from 'react-toastify'

export default function AdvertiseModal({ onClose }) {
  const [adGoal, setAdGoal] = useState('reach')
  const [budget, setBudget] = useState(5)
  const [duration, setDuration] = useState(7)

  const handleCreateAd = (e) => {
    e.preventDefault()
    toast.success('Your advertisement campaign is under review.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Advertisement</h3>
            <p className="text-sm text-gray-500 mt-1">Reach more people across Meta apps</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleCreateAd} className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Campaign Goal</label>
              <select 
                value={adGoal} 
                onChange={e => setAdGoal(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="reach">Get more profile visits</option>
                <option value="messages">Get more messages</option>
                <option value="website">Get more website visitors</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Daily Budget (${budget})</label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={budget} 
                onChange={e => setBudget(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$1</span>
                <span>$50+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration ({duration} days)</label>
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={duration} 
                onChange={e => setDuration(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between mb-2">
                <span>Estimated Daily Reach:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{budget * 120} - {budget * 350} people</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                <span>Total Cost:</span>
                <span className="text-gray-900 dark:text-white">${budget * duration}.00</span>
              </p>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button 
            onClick={handleCreateAd}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Create Ad Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
