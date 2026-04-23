import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { studyplanApi } from '@/api/studyplanClient'

export default function Dashboard() {
  const user = studyplanApi.auth.getCurrentUser()

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Bienvenue sur StudPlan</h1>
          <p className="text-sm text-slate-600">
            Ton compte est bien créé et tu es connecté.
          </p>
          {user ? (
            <p className="text-sm text-slate-700">
              Connecté en tant que <span className="font-medium">{user.email}</span>
            </p>
          ) : null}
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Prochaines étapes</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Configurer tes préférences d’étude.</li>
            <li>Ajouter tes devoirs et objectifs.</li>
            <li>Connecter Pronote ou École Directe lorsque l’API sera branchée.</li>
          </ul>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await studyplanApi.auth.logout()
              window.location.href = '/login'
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
