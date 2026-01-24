import React, { useEffect, useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const loadStats = async () => {
    setError('')
    try {
      const token = localStorage.getItem('studyplan:token')
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Accès refusé')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError('Impossible de charger les stats admin.')
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tableau de bord admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Ici tu peux suivre l’activité globale, les tickets support et les intégrations.
            </p>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {stats ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Utilisateurs</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.users}</p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Actifs</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.activeUsers}</p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Devoirs</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.tasks}</p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Tickets support</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.supportTickets}</p>
                </div>
              </div>
            ) : null}
            <Button onClick={loadStats}>Rafraîchir</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
