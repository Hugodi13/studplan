import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { base44 } from '@/api/base44Client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      setError('Merci de renseigner ton email.')
      return
    }
    if (!password.trim()) {
      setError('Merci de renseigner ton mot de passe.')
      return
    }
    try {
      const user = await base44.auth.login({ email, password })
      onLogin?.(user)
      navigate('/')
    } catch (err) {
      setError('Connexion impossible. Vérifie tes identifiants.')
    }
  }

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe requis.')
      return
    }
    try {
      const user = await base44.auth.register({ email, password, name })
      onLogin?.(user)
      navigate('/')
    } catch (err) {
      setError('Inscription impossible. Vérifie les infos.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion StudyPlan</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Prénom</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleRegister}>
              Créer un compte
            </Button>
            <p className="text-xs text-slate-500">
              Les données sont sauvegardées localement par compte. Tu peux te déconnecter à tout moment.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
