import { useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { userAPI, authAPI } from '../../services/api'
import { useAuthStore } from '../../store'
import { Modal, Spinner } from './NewChatModal'

export default function ProfileModal({ onClose }) {
  const { user, updateUser, clearAuth } = useAuthStore()
  const [tab,        setTab]        = useState('profile') // profile | security
  const [fullName,   setFullName]   = useState(user?.fullName || '')
  const [about,      setAbout]      = useState(user?.about || '')
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [oldPwd,     setOldPwd]     = useState('')
  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const fileRef = useRef(null)

  async function saveProfile() {
    setSaving(true)
    try {
      const { data } = await userAPI.updateProfile({ fullName, about })
      updateUser(data.data)
      toast.success('Profile updated')
    } catch { toast.error('Failed to update profile') }
    finally  { setSaving(false) }
  }

  async function handlePictureChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('picture', file)
    try {
      const { data } = await userAPI.updatePicture(form)
      updateUser({ profilePicture: data.data.profilePicture })
      toast.success('Profile picture updated')
    } catch { toast.error('Failed to upload picture') }
    finally  { setUploading(false); e.target.value = '' }
  }

  async function changePassword() {
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return }
    if (newPwd.length < 8)     { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await authAPI.changePassword({ currentPassword: oldPwd, newPassword: newPwd })
      toast.success('Password changed successfully')
      setOldPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally { setSaving(false) }
  }

  async function deleteAccount() {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    try {
      await userAPI.deleteAccount()
      clearAuth()
      localStorage.clear()
      sessionStorage.clear()
    } catch { toast.error('Failed to delete account') }
  }

  const avatar = user?.profilePicture
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=22c55e&color=fff&size=128`

  return (
    <Modal title="Profile" onClose={onClose}>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
        {['profile', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors
              ${tab === t
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img src={avatar} alt={user?.fullName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900/40" />
              <button onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full
                           flex items-center justify-center text-white shadow-md
                           hover:bg-primary-600 transition-colors">
                {uploading
                  ? <Spinner size={4} />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>}
              </button>
            </div>
            <input ref={fileRef} type="file" className="hidden"
              accept="image/*" onChange={handlePictureChange} />
          </div>

          {/* User info (read-only) */}
          <div className="space-y-1 text-center">
            <p className="text-xs text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-400">{user?.phone}</p>
          </div>

          {/* Editable fields */}
          {[
            { label: 'Full Name', value: fullName, set: setFullName, max: 100 },
            { label: 'About',     value: about,    set: setAbout,    max: 500 },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {f.label}
              </label>
              <input type="text" maxLength={f.max} value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}

          <button onClick={saveProfile} disabled={saving}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50
                       text-white font-semibold rounded-xl transition-colors flex justify-center gap-2">
            {saving ? <Spinner size={4} /> : null}
            Save Changes
          </button>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">Change Password</h3>

          {[
            { label: 'Current Password',  value: oldPwd,     set: setOldPwd },
            { label: 'New Password',      value: newPwd,     set: setNewPwd },
            { label: 'Confirm Password',  value: confirmPwd, set: setConfirmPwd },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
              <input type="password" value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}

          <button onClick={changePassword} disabled={saving}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50
                       text-white font-semibold rounded-xl transition-colors">
            {saving ? 'Updating…' : 'Update Password'}
          </button>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Privacy Settings</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Read Receipts</p>
                <p className="text-xs text-gray-500 mt-0.5">If turned off, you won't send or receive read receipts.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" 
                  checked={user?.readReceiptsEnabled !== false}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    try {
                      const { data } = await userAPI.toggleReadReceipts(enabled);
                      updateUser({ readReceiptsEnabled: data.data.readReceiptsEnabled });
                      toast.success(enabled ? 'Read receipts enabled' : 'Read receipts disabled');
                    } catch { toast.error('Failed to update settings'); }
                  }} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mt-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">App Lock</p>
                <p className="text-xs text-gray-500 mt-0.5">Require a PIN to open the app.</p>
              </div>
              <button 
                onClick={() => {
                  const pin = window.prompt("Enter a 6-digit PIN to enable App Lock, or leave empty to disable:");
                  if (pin === null) return;
                  if (pin === "") {
                    useAuthStore.getState().setLockPin(null);
                    toast.success('App Lock disabled');
                  } else if (/^\d{6}$/.test(pin)) {
                    useAuthStore.getState().setLockPin(pin);
                    toast.success('App Lock enabled');
                  } else {
                    toast.error('PIN must be exactly 6 digits');
                  }
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-gray-800 dark:text-white"
              >
                {useAuthStore.getState().lockPin ? 'Change PIN' : 'Enable'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
            <button onClick={deleteAccount}
              className="w-full py-2.5 border border-red-300 text-red-500
                         hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl
                         text-sm font-medium transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
