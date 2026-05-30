import { useState } from 'react'

export default function ListManagerModal({ customLists, setCustomLists, chats, onClose }) {
  const [editingList, setEditingList] = useState(null) // null if creating new, or the list object
  const [listName, setListName] = useState('')
  const [selectedChats, setSelectedChats] = useState([])

  const handleCreateNew = () => {
    setEditingList({ id: Date.now().toString() })
    setListName('')
    setSelectedChats([])
  }

  const handleEdit = (list) => {
    setEditingList(list)
    setListName(list.name)
    setSelectedChats(list.chats || [])
  }

  const handleDelete = (id) => {
    const updated = customLists.filter(l => l.id !== id)
    setCustomLists(updated)
    localStorage.setItem('chat_lists', JSON.stringify(updated))
  }

  const handleSave = () => {
    if (!listName.trim()) return
    const updatedList = { id: editingList.id, name: listName, chats: selectedChats }
    
    let updatedAll = []
    if (customLists.find(l => l.id === editingList.id)) {
      updatedAll = customLists.map(l => l.id === editingList.id ? updatedList : l)
    } else {
      updatedAll = [...customLists, updatedList]
    }
    
    setCustomLists(updatedAll)
    localStorage.setItem('chat_lists', JSON.stringify(updatedAll))
    setEditingList(null)
  }

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev => 
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingList ? 'Edit List' : 'Custom Lists'}
          </h2>
          <button onClick={() => {
            if (editingList) setEditingList(null)
            else onClose()
          }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {!editingList ? (
            <div className="space-y-4">
              <button 
                onClick={handleCreateNew}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary-500 text-primary-600 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Create New List
              </button>

              <div className="space-y-2 mt-4">
                {customLists.map(list => (
                  <div key={list.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{list.name}</h3>
                      <p className="text-xs text-gray-500">{list.chats.length} chats</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(list)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(list.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {customLists.length === 0 && (
                  <p className="text-center text-sm text-gray-500 mt-6">You don't have any custom lists yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">List Name</label>
                <input 
                  type="text" 
                  value={listName}
                  onChange={e => setListName(e.target.value)}
                  placeholder="e.g. Work, Family"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Chats</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {chats.map(chat => (
                    <div 
                      key={chat.id} 
                      onClick={() => toggleChatSelection(chat.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                        ${selectedChats.includes(chat.id) ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0
                        ${selectedChats.includes(chat.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selectedChats.includes(chat.id) && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                        )}
                      </div>
                      <img src={chat.chatType === 'GROUP' ? (chat.groupIcon || `https://ui-avatars.com/api/?name=${chat.groupName}&background=random`) : (chat.participants?.[0]?.profilePicture || `https://ui-avatars.com/api/?name=${chat.name}&background=random`)} alt="chat" className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{chat.name || chat.groupName}</span>
                    </div>
                  ))}
                  {chats.length === 0 && <p className="text-xs text-gray-500">No chats available</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {editingList && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
            <button onClick={() => setEditingList(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!listName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 disabled:opacity-50 hover:bg-primary-700 rounded-lg transition-colors">
              Save List
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
