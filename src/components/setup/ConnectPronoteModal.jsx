import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { School, ExternalLink, FileArchive } from 'lucide-react'
import { useI18n } from '@/lib/I18nContext'
import pronoteGuide from '@/assets/pronote-user-guide.png'
import ecoleDirecteGuide from '@/assets/ecoledirecte-user-guide.png'

export default function ConnectPronoteModal({ open, onOpenChange, onOpenPdfImport }) {
  const { locale } = useI18n()
  const isEn = locale === 'en'
  const tx = {
    title: isEn ? 'Import from Pronote / Ecole Directe' : 'Importer depuis Pronote / École Directe',
    subtitle: isEn
      ? 'No login needed: export homework as PDF, then import it in StudPlan.'
      : "Aucune connexion nécessaire : exporte les devoirs en PDF puis importe-les dans StudPlan.",
    guideTitle: isEn ? 'Recommended: import Pronote PDF' : 'Recommandé : import PDF Pronote',
    guide1: isEn ? '1) In Pronote -> Homework, click print/export and generate a PDF.' : '1) Dans Pronote -> Cahier de texte, clique sur imprimer/exporter puis génère un PDF.',
    guide2: isEn
      ? '2) PDF export is available on web/desktop session. Then import it in StudPlan.'
      : "2) L'export PDF se fait sur la session web/ordinateur, puis importe-le dans StudPlan.",
    pdfWebHintPronote: isEn
      ? 'Tip: if the mobile app does not let you save a PDF, open Pronote in your browser (Pronote web) and print / save as PDF from there.'
      : "Astuce : si l'app mobile ne permet pas d'enregistrer un PDF, ouvre Pronote dans le navigateur (Pronote web) et enregistre en PDF depuis là.",
    openPronote: isEn ? 'Open Pronote (app first)' : "Ouvrir Pronote (app d'abord)",
    importPdf: isEn ? 'Import Pronote PDF' : 'Importer un PDF Pronote',
    guideTitleEd: isEn ? 'Recommended: import Ecole Directe PDF' : 'Recommandé : import PDF École Directe',
    guideEd1: isEn ? '1) In Ecole Directe -> Homework, use print/export and generate a PDF.' : '1) Dans École Directe -> devoirs, utilise imprimer/exporter puis génère un PDF.',
    guideEd2: isEn
      ? '2) PDF export is available on web/desktop session. Then import it in StudPlan.'
      : "2) L'export PDF se fait sur la session web/ordinateur, puis importe-le dans StudPlan.",
    pdfWebHintEd: isEn
      ? 'Tip: if the mobile app does not let you save a PDF, open École Directe in your browser (web version) and print / save as PDF from there.'
      : "Astuce : si l'app mobile ne permet pas d'enregistrer un PDF, ouvre École Directe dans le navigateur (version web) et enregistre en PDF depuis là.",
    openEd: isEn ? 'Open Ecole Directe' : 'Ouvrir École Directe',
    importPdfEd: isEn ? 'Import Ecole Directe PDF' : 'Importer un PDF École Directe',
    stepVisual: isEn ? 'Visual guide' : 'Guide visuel',
  }
  const [activeTab, setActiveTab] = useState('pronote')

  const openPronote = () => {
    const webTarget = 'https://www.index-education.com/fr/espaces-pronote.php'
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
    if (isMobile) {
      window.location.href = 'pronote://'
      setTimeout(() => {
        window.open(webTarget, '_blank', 'noopener,noreferrer')
      }, 700)
      return
    }
    window.open(webTarget, '_blank', 'noopener,noreferrer')
  }

  const openEcoleDirecte = () => {
    window.open('https://www.ecoledirecte.com', '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <School className="w-4 h-4 text-white" />
            </div>
            {tx.title}
          </DialogTitle>
          <DialogDescription>
            {tx.subtitle}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-slate-100 rounded-xl">
            <TabsTrigger value="pronote" className="rounded-lg min-h-[44px] text-sm font-semibold">
              Pronote
            </TabsTrigger>
            <TabsTrigger value="ecoledirecte" className="rounded-lg min-h-[44px] text-sm font-semibold">
              École Directe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pronote" className="space-y-4 mt-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 space-y-2">
              <p className="text-sm font-semibold text-indigo-900">{tx.guideTitle}</p>
              <p className="text-xs text-indigo-800">{tx.guide1}</p>
              <p className="text-xs text-indigo-800">{tx.guide2}</p>
              <p className="text-xs text-indigo-700/90 italic border-t border-indigo-200/80 pt-2 mt-1">
                {tx.pdfWebHintPronote}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="outline" className="border-indigo-300 text-indigo-900" onClick={openPronote}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {tx.openPronote}
                </Button>
                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    onOpenChange(false)
                    onOpenPdfImport?.('pronote')
                  }}
                >
                  <FileArchive className="w-4 h-4 mr-1" />
                  {tx.importPdf}
                </Button>
              </div>
            </div>
            <img
              src={pronoteGuide}
              alt={tx.stepVisual}
              className="w-full rounded-lg border border-slate-200 bg-white"
            />
          </TabsContent>

          <TabsContent value="ecoledirecte" className="space-y-4 mt-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 space-y-2">
              <p className="text-sm font-semibold text-indigo-900">{tx.guideTitleEd}</p>
              <p className="text-xs text-indigo-800">{tx.guideEd1}</p>
              <p className="text-xs text-indigo-800">{tx.guideEd2}</p>
              <p className="text-xs text-indigo-700/90 italic border-t border-indigo-200/80 pt-2 mt-1">
                {tx.pdfWebHintEd}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="outline" className="border-indigo-300 text-indigo-900" onClick={openEcoleDirecte}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {tx.openEd}
                </Button>
                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    onOpenChange(false)
                    onOpenPdfImport?.('ecoledirecte')
                  }}
                >
                  <FileArchive className="w-4 h-4 mr-1" />
                  {tx.importPdfEd}
                </Button>
              </div>
            </div>
            <img
              src={ecoleDirecteGuide}
              alt={tx.stepVisual}
              className="w-full rounded-lg border border-slate-200 bg-white"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
