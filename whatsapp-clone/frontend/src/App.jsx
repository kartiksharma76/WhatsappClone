import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage     from './pages/ChatPage'
import JoinChatPage from './pages/JoinChatPage'
import { useAuthStore, useUIStore } from './store'
import AppLockScreen from './components/AppLockScreen'

function PrivateRoute({ children }) {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { accessToken } = useAuthStore()
  return accessToken ? <Navigate to="/" replace /> : children
}

export default function App() {
  const { initTheme } = useUIStore()
  const { darkMode }  = useUIStore()

  useEffect(() => { initTheme() }, [])

  return (
    <BrowserRouter>
      <div className={darkMode ? 'dark' : ''}>
        <AppLockScreen />
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/join/:token" element={<PrivateRoute><JoinChatPage /></PrivateRoute>} />
          <Route path="/"         element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          theme={darkMode ? 'dark' : 'light'}
          toastClassName="text-sm"
        />
      </div>
    </BrowserRouter>
  )
}
