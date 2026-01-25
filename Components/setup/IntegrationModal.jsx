import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Sparkles, ArrowRight } from "lucide-react";

const CLASS_LEVELS = [
  { value: 'sixieme', label: '6ème', category: 'college' },
  { value: 'cinquieme', label: '5ème', category: 'college' },
  { value: 'quatrieme', label: '4ème', category: 'college' },
  { value: 'troisieme', label: '3ème', category: 'college' },
  { value: 'seconde', label: '2nde', category: 'lycee' },
  { value: 'premiere', label: '1ère', category: 'lycee' },
  { value: 'terminale', label: 'Terminale', category: 'lycee' },
  { value: 'prepa', label: 'Prépa', category: 'superieur' },
  { value: 'universite', label: 'Université', category: 'superieur' },
  { value: 'professionnel', label: 'Professionnel', category: 'professionnel' }
];

const SUBJECTS_BY_LEVEL = {
  college: [
    "Mathématiques", "Français", "Histoire-Géographie", "Physique-Chimie",
    "SVT", "Anglais", "Espagnol", "Allemand", "Arts", "Technologie", "EPS"
  ],
  seconde: [
    "Mathématiques", "Français", "Histoire-Géographie", "Physique-Chimie",
    "SVT", "SES", "Anglais", "Espagnol", "Allemand", "SNT", "EPS"
  ],
  premiere_terminale: [
    "Philosophie", "Français", "Histoire-Géographie", "Anglais", "EPS",
    // Spécialités
    "Maths", "Physique-Chimie", "SVT", "SES", "NSI", "SI",
    "HGGSP", "HLP", "LLCER", "Arts", "Biologie-Écologie"
  ],
  prepa: [
    "Mathématiques", "Physique", "Chimie", "SI", "Informatique",
    "Français-Philo", "Anglais", "LV2", "TIPE"
  ],
  universite: [
    "Cours 1", "Cours 2", "Cours 3", "Cours 4", "TD", "TP", "Projet"
  ]
};

const SPECIALTIES = [
  "Maths", "Physique-Chimie", "SVT", "NSI", "SES", "SI",
  "HGGSP", "HLP", "LLCER Anglais", "LLCER Espagnol", "Arts"
];

export default function OnboardingModal({ open, onComplete }) {
  const [step, setStep] = useState(1);
  const [classLevel, setClassLevel] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);

  const needsSpecialties = ['premiere', 'terminale'].includes(classLevel);

  const handleComplete = () => {
    onComplete({
      class_level: classLevel,
      specialties: selectedSpecialties,
      onboarding_completed: true
    });
  };

  const toggleSpecialty = (specialty) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
    } else if (selectedSpecialties.length < 3) {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" hideClose>
        {step === 1 ? (
          <>
            <DialogHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl text-center">
                Bienvenue sur StudyPlan !
              </DialogTitle>
              <DialogDescription className="text-center">
                Commençons par configurer ton profil pour personnaliser tes révisions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-6">
              <Label className="text-base">Tu es en quelle classe ?</Label>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Collège</p>
                <div className="grid grid-cols-4 gap-2">
                  {CLASS_LEVELS.filter(c => c.category === 'college').map(level => (
                    <Button
                      key={level.value}
                      variant={classLevel === level.value ? "default" : "outline"}
                      onClick={() => setClassLevel(level.value)}
                      className={classLevel === level.value ? "bg-violet-600" : ""}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Lycée</p>
                <div className="grid grid-cols-3 gap-2">
                  {CLASS_LEVELS.filter(c => c.category === 'lycee').map(level => (
                    <Button
                      key={level.value}
                      variant={classLevel === level.value ? "default" : "outline"}
                      onClick={() => setClassLevel(level.value)}
                      className={classLevel === level.value ? "bg-violet-600" : ""}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Supérieur</p>
                <div className="grid grid-cols-2 gap-2">
                  {CLASS_LEVELS.filter(c => c.category === 'superieur').map(level => (
                    <Button
                      key={level.value}
                      variant={classLevel === level.value ? "default" : "outline"}
                      onClick={() => setClassLevel(level.value)}
                      className={classLevel === level.value ? "bg-violet-600" : ""}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Autre</p>
                <div className="grid grid-cols-1 gap-2">
                  {CLASS_LEVELS.filter(c => c.category === 'professionnel').map(level => (
                    <Button
                      key={level.value}
                      variant={classLevel === level.value ? "default" : "outline"}
                      onClick={() => setClassLevel(level.value)}
                      className={classLevel === level.value ? "bg-violet-600" : ""}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => needsSpecialties ? setStep(2) : handleComplete()}
              disabled={!classLevel}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {needsSpecialties ? 'Suivant' : 'Commencer'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Tes spécialités</DialogTitle>
              <DialogDescription>
                Sélectionne jusqu'à 3 spécialités que tu suis cette année
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-6">
              {SPECIALTIES.map(specialty => {
                const isSelected = selectedSpecialties.includes(specialty);
                const canSelect = selectedSpecialties.length < 3 || isSelected;
                
                return (
                  <button
                    key={specialty}
                    onClick={() => canSelect && toggleSpecialty(specialty)}
                    disabled={!canSelect}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50'
                        : canSelect
                        ? 'border-slate-200 hover:border-slate-300 bg-white'
                        : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isSelected ? 'text-violet-700' : 'text-slate-700'}`}>
                        {specialty}
                      </span>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-sm text-center text-slate-500 mb-4">
              {selectedSpecialties.length}/3 spécialités sélectionnées
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedSpecialties.length === 0}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                Commencer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}