import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import Support from './pages/Support'
import Admin from './pages/Admin'
import { getStoredUser } from './auth/localAuth'

const queryClient = new QueryClient()

const App = () => {
  const isAuthed = Boolean(getStoredUser())

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isAuthed ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
