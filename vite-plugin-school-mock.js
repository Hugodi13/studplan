/**
 * En `npm run dev`, Vite ne sert pas le dossier /api (Vercel/Cloudflare).
 * Ce plugin répond sur /api/integrations/* avec des tâches de démo
 * pour que l’UI sync + import fonctionne en local.
 * Désactive avec VITE_SCHOOL_MOCK=0
 */

function tomorrowIsoDate() {
  return new Date(Date.now() + 86400000).toISOString().split('T')[0]
}

function inTwoDays() {
  return new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
}

export function schoolApiMock() {
  return {
    name: 'school-api-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (process.env.VITE_SCHOOL_MOCK === '0') {
          return next()
        }
        const path = (req.url || '').split('?')[0]
        if (req.method !== 'POST' || !path.startsWith('/api/integrations/')) {
          return next()
        }

        if (path === '/api/integrations/pronote') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              mock: true,
              tasks: [
                {
                  title: 'Exercices ch.4 (démo — lance un vrai backend pour Pronote)',
                  subject: 'Mathématiques',
                  description: 'Tâche générée par le serveur de dev Vite.',
                  difficulty: 'moyen',
                  estimated_minutes: 45,
                  due_date: tomorrowIsoDate(),
                },
              ],
            }),
          )
          return
        }

        if (path === '/api/integrations/ecoledirecte') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              mock: true,
              tasks: [
                {
                  title: 'DM Anglais (démo — lance un vrai backend pour École Directe)',
                  subject: 'Anglais',
                  description: 'Tâche générée par le serveur de dev Vite.',
                  difficulty: 'facile',
                  estimated_minutes: 30,
                  due_date: inTwoDays(),
                },
              ],
            }),
          )
          return
        }

        return next()
      })
    },
  }
}
