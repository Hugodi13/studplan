import React, { useState } from 'react'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, Share2, PlusSquare } from "lucide-react";

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  return (
    <>
    <div className="max-w-3xl mx-auto px-4 mt-6">
      <div className="install-tip-surface rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4 text-sm text-violet-900 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <span>Ajoute StudPlan à l’écran d’accueil pour l’ouvrir en 1 clic, comme une vraie app.</span>
        <Button type="button" size="sm" variant="outline" className="border-violet-300" onClick={() => setOpen(true)}>
          <Smartphone className="w-4 h-4 mr-1" />
          Comment faire
        </Button>
      </div>
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Installer l’app sur mobile</DialogTitle>
          <DialogDescription>
            2 étapes rapides selon ton téléphone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-violet-600" />
              iPhone (Safari)
            </p>
            <p>Ouvre StudPlan, touche <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong>.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold flex items-center gap-2 mb-1">
              <PlusSquare className="w-4 h-4 text-violet-600" />
              Android (Chrome)
            </p>
            <p>Ouvre StudPlan, menu <strong>⋮</strong>, puis <strong>Ajouter à l’écran d’accueil</strong> ou <strong>Installer l’application</strong>.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
