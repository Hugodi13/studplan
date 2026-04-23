import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { studyplanApi } from '@/api/studyplanClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, BookOpen, Loader2, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [devToken, setDevToken] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!email.trim()) {
      setErr('Renseigne ton email')
      return
    }
    setLoading(true)
    try {
      const { devToken: t, emailSent: sent } = await studyplanApi.auth.forgotPassword(email.trim())
      setDevToken(t || '')
      setEmailSent(!!sent)
      setDone(true)
    } catch (er) {
      setErr(er?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-100/50 px-4 py-8">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg mb-2">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Mot de passe oublié</h1>
          <p className="text-sm text-slate-600 mt-1">
            Renseigne ton email puis vérifie tes spams, promotions et courriers indésirables.
          </p>
        </div>

        <Card className="p-5 border-slate-200/80 shadow-lg">
          {!done ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
              <Button type="submit" disabled={loading} className="w-full h-11 bg-violet-600">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer'}
              </Button>
            </form>
          ) : (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Mail className="h-4 w-4" />
                Si un compte existe, un e-mail t’a été envoyé (vérifie spams, promotions et indésirables).
              </div>
              {devToken && (
                <p className="text-xs p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 break-all">
                  Lien de réinitialisation (uniquement si l’API l’expose) :<br />
                  {`${window.location.origin}/reset-password?token=${encodeURIComponent(devToken)}`}
                </p>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Retour à la connexion</Link>
              </Button>
            </div>
          )}
        </Card>

        <Button variant="ghost" asChild className="w-full text-slate-600">
          <Link to="/login" className="inline-flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
    </div>
  )
}
