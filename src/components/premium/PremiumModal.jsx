import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Zap, Shield, TrendingUp } from "lucide-react";

export default function PremiumModal({ open, onOpenChange, onUpgrade }) {
  const features = {
    free: [
      "10 tâches maximum",
      "Planning de base",
      "Import manuel",
      "Sync Pronote/ED (1 jour)",
      "Système de récompenses"
    ],
    premium: [
      "Tâches illimitées",
      "Planning IA avancé",
      "Sync Pronote/ED (semaine complète)",
      "Analyses et statistiques",
      "Révision espacée optimisée",
      "Support prioritaire",
      "Sans publicité"
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown className="w-5 h-5 text-white" />
            </div>
            Passe à StudyPlan Premium
          </DialogTitle>
          <DialogDescription>
            Débloque toutes les fonctionnalités pour maximiser ta réussite
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-6">
          {/* Free Plan */}
          <Card className="p-6 border-2 border-slate-200">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-700">Gratuit</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">0€</span>
                <span className="text-slate-500">/mois</span>
              </div>
            </div>
            <ul className="space-y-3">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Premium Plan */}
          <Card className="p-6 border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                POPULAIRE
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                Premium
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-amber-900">1€</span>
                <span className="text-amber-700">/mois</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">Annulable à tout moment</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {features.premium.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-900 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={onUpgrade}
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            >
              <Zap className="w-4 h-4 mr-2" />
              Passer à Premium
            </Button>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-violet-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">Paiement sécurisé</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">Notes en hausse</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">Sans engagement</p>
          </div>
        </div>

        <p className="text-xs text-center text-slate-500 mt-4">
          💳 Paiement via Stripe • Annulation en 1 clic • Remboursement sous 7 jours
        </p>
      </DialogContent>
    </Dialog>
  );
}