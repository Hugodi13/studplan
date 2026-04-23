import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import Support from './pages/Support'
import Admin from './pages/Admin'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { I18nProvider } from './lib/I18nContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { initSupabaseSessionListener } from './lib/supabaseUserSync'
import { initAuthSession, studyplanApi } from './api/studyplanClient'

const queryClient = new QueryClient()

const App = () => {
  const [authReady, setAuthReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useLayoutEffect(() => {
    void (async () => {
      if (isSupabaseConfigured()) {
        await initAuthSession()
      } else {
        studyplanApi.auth.validateSession()
      }
      setIsAuthed(Boolean(studyplanApi.auth.getCurrentUser()))
      setAuthReady(true)
    })()
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    return initSupabaseSessionListener()
  }, [])

  useEffect(() => {
    const handleAuth = () => setIsAuthed(Boolean(studyplanApi.auth.getCurrentUser()))
    window.addEventListener('storage', handleAuth)
    window.addEventListener('studyplan:auth', handleAuth)
    return () => {
      window.removeEventListener('storage', handleAuth)
      window.removeEventListener('studyplan:auth', handleAuth)
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyScheme = () => {
      document.documentElement.classList.toggle('dark', media.matches)
      document.body.classList.toggle('dark', media.matches)
    }
    applyScheme()
    media.addEventListener('change', applyScheme)
    return () => media.removeEventListener('change', applyScheme)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BrowserRouter>
          {!authReady ? (
            <div className="min-h-dvh min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-violet-50/30 px-4 text-slate-600 text-sm">
              <div className="text-center space-y-2">
                <p className="font-semibold text-slate-800">StudPlan</p>
                <p>Préparation de l’espace…</p>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={isAuthed ? <Home /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

export default App
