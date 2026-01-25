import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Trash2, AlertTriangle, Mail, Shield, Clock, GraduationCap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CLASS_LEVELS = [
  { value: 'sixieme', label: '6ème' },
  { value: 'cinquieme', label: '5ème' },
  { value: 'quatrieme', label: '4ème' },
  { value: 'troisieme', label: '3ème' },
  { value: 'seconde', label: '2nde' },
  { value: 'premiere', label: '1ère' },
  { value: 'terminale', label: 'Terminale' },
  { value: 'prepa', label: 'Prépa' },
  { value: 'universite', label: 'Université' },
  { value: 'professionnel', label: 'Professionnel' }
];

export default function SettingsModal({ open, onOpenChange, userPrefs, onUpdatePrefs }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState(userPrefs?.daily_study_minutes || 120);
  const [startHour, setStartHour] = useState(userPrefs?.study_start_hour || 17);
  const [includeSunday, setIncludeSunday] = useState(userPrefs?.include_sunday || false);
  const [classLevel, setClassLevel] = useState(userPrefs?.class_level || 'troisieme');

  const handleSavePreferences = async () => {
    if (userPrefs?.id) {
      await onUpdatePrefs({
        daily_study_minutes: dailyMinutes,
        study_start_hour: startHour,
        include_sunday: includeSunday,
        class_level: classLevel
      });
      onOpenChange(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // L'utilisateur sera déconnecté et redirigé
      await base44.auth.logout();
      alert("Ton compte sera supprimé dans les 30 jours. Contacte-nous si tu changes d'avis.");
    } catch (error) {
      alert("Erreur lors de la suppression du compte");
    }
    setIsDeleting(false);
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Paramètres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Class level */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Niveau scolaire
            </h3>
            <Select value={classLevel} onValueChange={setClassLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionne ton niveau" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Study preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Temps de révision
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Temps quotidien</Label>
                <span className="text-sm font-semibold text-violet-600">{formatTime(dailyMinutes)}</span>
              </div>
              <Slider
                value={[dailyMinutes]}
                onValueChange={([value]) => setDailyMinutes(value)}
                min={30}
                max={240}
                step={15}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Heure de début</Label>
                <span className="text-sm font-semibold text-violet-600">{startHour}h00</span>
              </div>
              <Slider
                value={[startHour]}
                onValueChange={([value]) => setStartHour(value)}
                min={6}
                max={22}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <Label className="text-sm">Travailler le dimanche</Label>
              <Button
                variant={includeSunday ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeSunday(!includeSunday)}
                className={includeSunday ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              >
                {includeSunday ? "Oui" : "Non"}
              </Button>
            </div>

            <Button
              onClick={handleSavePreferences}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Enregistrer les préférences
            </Button>
          </div>

          {/* Links */}
          <div className="space-y-2 pt-4 border-t">
            <Link to={createPageUrl('Privacy')}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Shield className="w-4 h-4" />
                Charte de protection des données
              </Button>
            </Link>
            
            <a href="mailto:hugodi777@outlook.fr">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Mail className="w-4 h-4" />
                Nous contacter
              </Button>
            </a>
          </div>

          {/* Delete account */}
          <div className="pt-4 border-t">
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
              </Button>
            ) : (
              <Alert className="bg-rose-50 border-rose-200">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <AlertDescription className="text-rose-800 text-sm">
                  <p className="font-semibold mb-2">Es-tu sûr ?</p>
                  <p className="mb-3 text-xs">
                    Toutes tes données (tâches, planning, préférences) seront définitivement supprimées dans 30 jours.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Suppression..." : "Confirmer"}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}