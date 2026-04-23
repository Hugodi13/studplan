import React, { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { studyplanApi } from '@/api/studyplanClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/I18nContext'

const MIN_PASSWORD_LEN = 8

const mapAuthError = (err) => {
  const code = String(err?.message || '')
  if (code.includes('exists')) return 'Un compte existe déjà avec cet email.'
  if (code.includes('8 characters')) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (code === 'EMAIL_NOT_VERIFIED') return 'Vérifie ton email avant de te connecter.'
  if (code === 'Login failed') return 'Email ou mot de passe incorrect.'
  if (code) return code
  return 'Erreur de connexion. Réessaie.'
}

export default function Login() {
  const { locale, setLocale, languages, t } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [founderSlots, setFounderSlots] = useState(null)

  const signupPasswordOk = mode === 'signup' && password.length >= MIN_PASSWORD_LEN
  const signupConfirmOk = mode === 'signup' && confirmPassword.length > 0 && password === confirmPassword

  useEffect(() => {
    if (studyplanApi.auth.getCurrentUser()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (location.state?.resetOk) {
      setInfo('Mot de passe modifié. Tu peux te connecter.')
    }
  }, [location.state])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const s = await studyplanApi.billing.getFounderSlotsInfo()
        if (!cancelled) setFounderSlots(s)
      } catch {
        if (!cancelled) setFounderSlots(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const founderText = useMemo(() => {
    if (!founderSlots) return null
    const rem = founderSlots.remaining ?? 0
    if (rem <= 0) return null
    return `${rem} places fondateur restantes`
  }, [founderSlots])

  const onGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await studyplanApi.auth.loginWithGoogle('')
      // Redirection OAuth navigateur
    } catch (e) {
      setError(mapAuthError(e))
      setLoading(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.trim() || !password) {
      setError('Renseigne ton email et ton mot de passe.')
      return
    }

    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD_LEN) {
        setError(`Mot de passe minimum: ${MIN_PASSWORD_LEN} caractères.`)
        return
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await studyplanApi.auth.login({ email: email.trim(), password })
      } else {
        const res = await studyplanApi.auth.register({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        })
        if (res?.kind === 'verify') {
          setInfo(`Compte créé. Vérifie ta boîte mail: ${res.email}`)
          setMode('signin')
          setPassword('')
          setConfirmPassword('')
          setLoading(false)
          return
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      navigate('/', { replace: true })
    } catch (e) {
      setError(mapAuthError(e))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-100/40 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-7 space-y-5 shadow-xl border-slate-200/80">
        <div className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">StudPlan</h1>
          <p className="text-sm text-slate-600 mt-1">
            {mode === 'signin' ? t('signIn') : t('signUp')}
          </p>
          {founderText ? (
            <p className="mt-2 text-xs text-amber-700 font-medium">
              {founderText}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <span className="text-xs font-semibold text-slate-500">Langue</span>
          <div className="inline-flex items-center rounded-full bg-white p-1 shadow-sm border border-slate-200">
            {Object.entries(languages).map(([code, label]) => {
              const active = locale === code
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={
                    'px-3 py-1.5 text-xs font-semibold rounded-full transition-all ' +
                    (active
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900')
                  }
                  aria-pressed={active}
                >
                  {label === 'Français' ? 'FR' : 'EN'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === 'signin' ? 'default' : 'outline'}
            onClick={() => {
              setMode('signin')
              setError('')
              setInfo('')
            }}
          >
            {t('signIn')}
          </Button>
          <Button
            type="button"
            variant={mode === 'signup' ? 'default' : 'outline'}
            onClick={() => {
              setMode('signup')
              setError('')
              setInfo('')
            }}
          >
            {t('signUp')}
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-slate-300 hover:bg-slate-50 font-medium"
          onClick={() => void onGoogle()}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirection...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden>
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.3 12 2.3 6.7 2.3 2.3 6.7 2.3 12S6.7 21.7 12 21.7c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"/>
              </svg>
              Continuer avec Google
            </>
          )}
        </Button>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1">
              <Label htmlFor="name">Nom (optionnel)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password')}</Label>
              {mode === 'signin' && (
                <Link to="/forgot-password" className="text-xs text-violet-700 hover:underline">
                  {t('forgot')}
                </Link>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 h-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className={'text-xs font-medium ' + (signupPasswordOk ? 'text-emerald-600' : 'text-slate-500')}>
                {signupPasswordOk ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Au moins 8 caractères
                  </span>
                ) : (
                  'Au moins 8 caractères requis'
                )}
              </p>
            )}
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <Label htmlFor="password2">Confirmer le mot de passe</Label>
              <Input
                id="password2"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
              />
              {signupConfirmOk ? (
                <p className="text-xs text-emerald-600 font-medium">Les mots de passe correspondent</p>
              ) : null}
            </div>
          )}

          {info && <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2">{info}</p>}
          {error && <p className="text-sm text-rose-700 bg-rose-50 rounded px-3 py-2">{error}</p>}

          <Button
            type="submit"
            className="w-full h-11 border-2 border-violet-900/35 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-700 hover:to-indigo-700 hover:border-violet-900/50 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : mode === 'signin' ? t('signIn') : t('signUp')}
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500">
          <Link to="/privacy" className="hover:underline">
            Charte de protection des données
          </Link>
        </div>
      </Card>
    </div>
  )
}
