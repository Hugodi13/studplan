import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { studyplanApi } from '@/api/studyplanClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'

const MIN = 8

export default function ResetPassword() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const token = search.get('token') || ''
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (password.length < MIN) {
      setErr(`Minimum ${MIN} caractères`)
      return
    }
    if (password !== password2) {
      setErr('Les mots de passe ne correspondent pas')
      return
    }
    if (!isSupabaseConfigured() && !token) {
      setErr('Lien invalide')
      return
    }
    setLoading(true)
    try {
      await studyplanApi.auth.resetPassword({ token: token || '', password })
      navigate('/login', { replace: true, state: { resetOk: true } })
    } catch (er) {
      setErr(er?.message || 'Impossible de réinitialiser')
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
          <h1 className="text-xl font-bold text-slate-900">Nouveau mot de passe</h1>
        </div>

        <Card className="p-5 border-slate-200/80 shadow-lg">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rp-1">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="rp-1"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-2">Confirmation</Label>
              <Input
                id="rp-2"
                type={show ? 'text' : 'password'}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="h-11"
              />
            </div>
            {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-violet-600">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
            </Button>
          </form>
        </Card>

        <Button variant="ghost" asChild className="w-full">
          <Link to="/login">Retour</Link>
        </Button>
      </div>
    </div>
  )
}
