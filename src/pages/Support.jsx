import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export default function Support() {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = async () => {
    setStatus('')
    const token = localStorage.getItem('studyplan:token')
    const response = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ message }),
    })
    if (response.ok) {
      setStatus('Ticket envoyé. Le support te répondra rapidement.')
      setMessage('')
    } else {
      setStatus('Impossible d\'envoyer le ticket.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Support & chatbot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Décris ton problème. Un agent support (humain + assistant IA) reviendra vers toi.
            </p>
            <Textarea
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Explique le souci..."
            />
            {status ? <p className="text-sm text-slate-700">{status}</p> : null}
            <Button onClick={handleSubmit} disabled={!message.trim()}>
              Envoyer au support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
