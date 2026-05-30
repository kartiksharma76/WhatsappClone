import { useState } from 'react'

export default function CommunitiesViewer({ chats }) {
  const [showCreate, setShowCreate] = useState(false)
  
  // For demo purposes, we will mock communities
  const [communities, setCommunities] = useState([
    {
      id: 1,
      name: 'Tech Enthusiasts',
      description: 'A community for tech lovers and developers',
      icon: 'https://ui-avatars.com/api/?name=TE&background=0D8ABC&color=fff',
      groups: ['React Devs', 'Node.js Backend']
    }
  ])

  const [newCommName, setNewCommName] = useState('')
  const [newCommDesc, setNewCommDesc] = useState('')

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newCommName) return
    setCommunities([...communities, {
      id: Date.now(),
      name: newCommName,
      description: newCommDesc,
      icon: `https://ui-avatars.com/api/?name=${newCommName}&background=random`,
      groups: []
    }])
    setShowCreate(false)
    setNewCommName('')
    setNewCommDesc('')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 select-none overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Communities</h2>
      </div>

      <div className="p-4">
        <button 
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center relative overflow-hidden">
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <div className="absolute bottom-0 right-0 bg-primary-500 rounded-tl-lg p-0.5">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
            </div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">New community</span>
        </button>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

        <div className="space-y-4">
          {communities.map(comm => (
            <div key={comm.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <img src={comm.icon} alt={comm.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{comm.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{comm.description || 'No description'}</p>
                </div>
              </div>
              
              {comm.groups.length > 0 ? (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  {comm.groups.map((group, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{group}</span>
                    </div>
                  ))}
                  <button className="flex items-center gap-3 p-2 w-full hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition mt-1 text-gray-500">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                    <span className="font-medium">View all</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                  <p>No groups in this community yet.</p>
                  <button className="text-primary-600 font-medium hover:underline mt-1">Add groups</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Community</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Community name" 
                    value={newCommName}
                    onChange={e => setNewCommName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-medium placeholder-gray-400"
                    autoFocus
                  />
                </div>
                <div>
                  <textarea 
                    placeholder="Community description" 
                    value={newCommDesc}
                    onChange={e => setNewCommDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white resize-none placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={!newCommName.trim()}
                  className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
