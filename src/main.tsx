import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const withGoogle = Boolean(googleId)

const AppTree = withGoogle ? (
  <GoogleOAuthProvider clientId={googleId}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {AppTree}
  </StrictMode>,
)
