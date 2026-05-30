import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { toast } from 'react-toastify';

export default function AppLockScreen() {
  const { lockPin, isLocked, setIsLocked } = useAuthStore();
  const [pinInput, setPinInput] = useState('');

  // Auto-lock when tab becomes invisible (e.g. user switches tabs or minimizes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && lockPin) {
        setIsLocked(true);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lockPin, setIsLocked]);

  const handleUnlock = () => {
    if (pinInput === lockPin) {
      setIsLocked(false);
      setPinInput('');
    } else {
      toast.error("Incorrect PIN");
      setPinInput('');
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Locked</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Enter your PIN to unlock the application.
        </p>

        <input 
          type="password" 
          maxLength={6}
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter PIN"
          className="w-full text-center tracking-[1em] px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg text-gray-900 dark:text-white mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUnlock();
          }}
          autoFocus
        />

        <button 
          onClick={handleUnlock}
          className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
