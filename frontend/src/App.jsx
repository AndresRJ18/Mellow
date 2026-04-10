import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Loading from './pages/Loading'
import Results from './pages/Results'
import AuthCallback from './pages/AuthCallback'
import LimitReached from './pages/LimitReached'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
    <SessionProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/loading" element={<ProtectedRoute><Loading /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/limit-reached" element={<ProtectedRoute><LimitReached /></ProtectedRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
    </AuthProvider>
  )
}
