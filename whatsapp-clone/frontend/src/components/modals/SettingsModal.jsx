import { useState } from 'react'

export default function SettingsModal({ onClose, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('account')

  const TABS = [
    { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'privacy', label: 'Privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'avatar', label: 'Avatar', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'chats', label: 'Chats', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'devices', label: 'Linked Devices', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden flex">
        
        {/* Left Sidebar */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
            <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.fullName}`} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{user?.fullName || 'User'}</h3>
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {TABS.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon}/></svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
          {activeTab === 'account' && (
            <div className="p-8 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition font-medium text-gray-800 dark:text-gray-200">Security notifications</button>
                <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition font-medium text-gray-800 dark:text-gray-200">Two-step verification</button>
                <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition font-medium text-gray-800 dark:text-gray-200">Change number</button>
                <button className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition font-medium text-gray-800 dark:text-gray-200">Request account info</button>
                <button className="w-full text-left p-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition font-medium" onClick={onLogout}>Log out</button>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="p-8 animate-fade-in flex flex-col h-full">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Linked Devices</h3>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6 border-4 border-dashed border-gray-300 dark:border-gray-500">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Use ChatApp on other devices</h4>
                <p className="text-gray-500 max-w-sm mb-8">Link a device to use ChatApp without keeping your phone online. You can link up to 4 devices.</p>
                <button className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
                  Link a Device
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="p-8 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Privacy</h3>
              <div className="space-y-4">
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer">
                  <h4 className="font-medium text-gray-900 dark:text-white">Last seen and online</h4>
                  <p className="text-sm text-gray-500">Nobody</p>
                </div>
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer">
                  <h4 className="font-medium text-gray-900 dark:text-white">Profile photo</h4>
                  <p className="text-sm text-gray-500">Everyone</p>
                </div>
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer">
                  <h4 className="font-medium text-gray-900 dark:text-white">About</h4>
                  <p className="text-sm text-gray-500">My contacts</p>
                </div>
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition flex justify-between items-center cursor-pointer">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Read receipts</h4>
                    <p className="text-sm text-gray-500">If turned off, you won't send or receive read receipts.</p>
                  </div>
                  <div className="w-12 h-6 bg-primary-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for others */}
          {['avatar', 'chats', 'notifications'].includes(activeTab) && (
            <div className="p-8 animate-fade-in flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 capitalize">{activeTab} Settings</h3>
              <p className="text-gray-500">This section is available in the mobile app or desktop client.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
