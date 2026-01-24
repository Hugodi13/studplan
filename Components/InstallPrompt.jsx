import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if already dismissed
    if (localStorage.getItem('installPromptDismissed')) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl z-50 border-0">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 rounded-xl bg-white/20">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Installer StudyPlan</h3>
          <p className="text-sm text-white/90 mb-3">
            Ajoute l'app à ton écran d'accueil pour un accès rapide
          </p>
          <Button
            onClick={handleInstall}
            className="w-full bg-white text-violet-700 hover:bg-white/90"
            size="sm"
          >
            Installer maintenant
          </Button>
        </div>
      </div>
    </Card>
  );
}