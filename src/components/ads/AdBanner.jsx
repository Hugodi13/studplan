import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ExternalLink, Sparkles } from 'lucide-react'

const VINTGEN_IMG_LEFT =
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80'
const VINTGEN_IMG_RIGHT =
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80'

/**
 * Pub interne Vintgen (lien via VITE_VINTGEN_URL).
 * Affichée uniquement côté parent quand l’utilisateur n’est pas premium.
 */
export default function AdBanner({ onUpgrade }) {
  const vintgenUrl = import.meta.env.VITE_VINTGEN_URL || 'https://vintgen.pages.dev'

  return (
    <Card className="mx-auto max-w-3xl p-2.5 sm:p-3 bg-gradient-to-r from-emerald-100/80 via-teal-50 to-cyan-100/70 border border-emerald-200/80 shadow-md shadow-emerald-100/50 overflow-hidden relative mb-4 sm:mb-5">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-200/30 blur-2xl pointer-events-none" />
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">Publicité</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-emerald-200 text-emerald-700 font-semibold">
            Partenaire
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
          <div className="bg-white/90 rounded-xl border border-emerald-200 p-1.5 min-h-[80px] sm:min-h-[90px] shadow-sm">
            <div className="grid grid-cols-2 gap-1.5 h-full min-h-[80px] sm:min-h-[88px]">
              <img
                src={VINTGEN_IMG_LEFT}
                alt="Vêtements seconde main"
                className="h-full w-full min-h-[76px] object-cover rounded-md border border-emerald-100 bg-slate-100"
                loading="lazy"
                decoding="async"
              />
              <img
                src={VINTGEN_IMG_RIGHT}
                alt="Style annonce en ligne"
                className="h-full w-full min-h-[76px] object-cover rounded-md border border-emerald-100 bg-slate-100"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="flex flex-col justify-between min-w-0 gap-1.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-emerald-900 leading-tight">Vintgen</h3>
                <p className="text-[11px] sm:text-xs text-emerald-800 mt-0.5 line-clamp-2">
                  Générateur IA d’annonces Vinted : photo → titre, description, catégorie, prix.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <a href={vintgenUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:flex-1">
                <Button className="w-full h-8 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  Découvrir <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </a>
              {onUpgrade ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onUpgrade}
                  className="w-full sm:w-auto h-8 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  Retirer les pubs (Premium)
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
