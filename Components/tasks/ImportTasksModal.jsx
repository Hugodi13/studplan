import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileText, Sparkles, AlertCircle, Loader2, Camera } from "lucide-react";
import { studyplanApi } from "@/api/studyplanClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSubjectsForLevel, calculateEstimatedMinutes } from "@/components/utils/subjects";

export default function ImportTasksModal({ open, onOpenChange, onImport, userPrefs }) {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const subjects = getSubjectsForLevel(
    userPrefs?.class_level || 'troisieme',
    userPrefs?.specialties || []
  ).join(', ');

  const handleImageUpload = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setError('');

    try {
      const { file_url } = await studyplanApi.integrations.Core.UploadFile({ file });
      setUploadedImage(file_url);
      
      const result = await studyplanApi.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant qui aide les élèves à organiser leurs devoirs.
        
Analyse cette photo de devoirs et extrais toutes les tâches. Pour chaque tâche:
- title: titre court et clair
- subject: la matière parmi: ${subjects}
- difficulty: facile, moyen ou difficile selon la complexité
- estimated_minutes: temps estimé en minutes (15-180), ajusté pour un élève en ${userPrefs?.class_level || 'troisieme'}
- due_date: date au format YYYY-MM-DD si mentionnée, sinon null
- description: résumé de ce qu'il faut faire

Sois précis sur les dates et les matières.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  subject: { type: "string" },
                  difficulty: { type: "string" },
                  estimated_minutes: { type: "number" },
                  due_date: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.tasks?.length > 0) {
        const tasksWithDefaults = result.tasks.map(task => ({
          ...task,
          source: 'photo',
          status: 'a_faire',
          priority: task.difficulty === 'difficile' ? 8 : task.difficulty === 'moyen' ? 5 : 3
        }));
        onImport(tasksWithDefaults);
        setUploadedImage(null);
        onOpenChange(false);
      } else {
        setError("Aucune tâche n'a pu être extraite de l'image.");
      }
    } catch (err) {
      setError("Erreur lors de l'analyse de l'image. Réessaie.");
    }
    
    setIsProcessing(false);
  };

  const handleTextImport = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    const result = await studyplanApi.integrations.Core.InvokeLLM({
      prompt: `Tu es un assistant qui aide à créer des tâches de révision.
      
Analyse ce texte et extrais les tâches/devoirs à faire. Pour chaque tâche, détermine:
- title: un titre court et clair
- subject: la matière parmi: ${subjects}
- difficulty: facile, moyen ou difficile selon le contenu et le niveau ${userPrefs?.class_level || 'troisieme'}
- estimated_minutes: estimation du temps en minutes (15-180), ajusté pour le niveau
- due_date: date au format YYYY-MM-DD si mentionnée, sinon null
- description: résumé de ce qu'il faut faire

Texte à analyser:
${textInput}`,
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                subject: { type: "string" },
                difficulty: { type: "string" },
                estimated_minutes: { type: "number" },
                due_date: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      }
    });
    
    if (result?.tasks?.length > 0) {
      const tasksWithDefaults = result.tasks.map(task => ({
        ...task,
        source: 'import',
        status: 'a_faire',
        priority: task.difficulty === 'difficile' ? 8 : task.difficulty === 'moyen' ? 5 : 3
      }));
      onImport(tasksWithDefaults);
      setTextInput('');
      onOpenChange(false);
    } else {
      setError("Aucune tâche n'a pu être extraite. Essaie de reformuler.");
    }
    
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Upload className="w-4 h-4 text-white" />
            </div>
            Importer des tâches
          </DialogTitle>
          <DialogDescription>
            Colle tes devoirs et l'IA créera automatiquement tes tâches de révision
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo" className="gap-2">
              <Camera className="w-4 h-4" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              Texte
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Info
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="photo" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Prends en photo ton cahier de texte</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
              
              {uploadedImage ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={uploadedImage} alt="Devoirs" className="w-full" />
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-400 bg-slate-50 hover:bg-violet-50/30 transition-all flex flex-col items-center justify-center gap-3 p-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-700">Prendre une photo</p>
                    <p className="text-sm text-slate-500 mt-1">L'IA va extraire tes devoirs automatiquement</p>
                  </div>
                </button>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-violet-600 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyse de la photo en cours...</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Colle ici tes devoirs</Label>
              <Textarea
                placeholder="Ex: Pour lundi 15 janvier:
- Maths: Exercices 1 à 5 page 42
- Français: Fiche de lecture Les Misérables
- Histoire: Réviser la Révolution française pour le contrôle..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleTextImport}
              disabled={!textInput.trim() || isProcessing}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser et créer les tâches
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="info" className="mt-4">
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Synchronisation automatique</h3>
              <p className="text-sm text-slate-500 mb-4">
                Configure la connexion à Pronote ou École Directe dans les paramètres pour synchroniser automatiquement tes devoirs en temps réel.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                ⚠️ Nécessite l'activation des backend functions
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-white text-xs font-medium text-slate-600 border">
                  🔒 Sécurisé
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white text-xs font-medium text-slate-600 border">
                  ⚡ Temps réel
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white text-xs font-medium text-slate-600 border">
                  🔄 Automatique
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}