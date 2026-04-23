import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { studyplanApi } from '@/api/studyplanClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export default function VerifyEmail() {
  const [search] = useSearchParams()
  const [state, setState] = useState('loading')
  const [err, setErr] = useState('')

  useEffect(() => {
    const token = search.get('token')
    if (!isSupabaseConfigured() && !token) {
      setState('error')
      setErr('Lien invalide')
      return
    }
    let cancel = false
    ;(async () => {
      try {
        await studyplanApi.auth.verifyEmail(token || '')
        if (!cancel) setState('ok')
      } catch (e) {
        if (!cancel) {
          setState('error')
          setErr(e?.message || 'Vérification impossible')
        }
      }
    })()
    return () => {
      cancel = true
    }
  }, [search])

  return (
    <div className="min-h-dvh min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/50 to-indigo-100/40 px-4 py-10">
      <Card className="w-full max-w-md p-8 text-center border-slate-200/80 shadow-xl">
        {state === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 mx-auto text-violet-600 animate-spin mb-4" />
            <h1 className="text-lg font-semibold text-slate-800">Vérification de ton email…</h1>
          </>
        )}
        {state === 'ok' && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-xl font-bold text-slate-900">C’est confirmé</h1>
            <p className="text-sm text-slate-600 mt-2">Tu peux te connecter à StudPlan.</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login">Se connecter</Link>
            </Button>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-rose-500 mb-4" />
            <h1 className="text-lg font-semibold text-slate-900">Lien expiré ou invalide</h1>
            <p className="text-sm text-slate-600 mt-2">{err}</p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to="/login">Retour</Link>
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
