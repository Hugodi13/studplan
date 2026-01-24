import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Sparkles, Edit3 } from "lucide-react";
import { getSubjectsForLevel, calculateEstimatedMinutes } from "@/components/utils/subjects";

export default function AddTaskModal({ open, onOpenChange, onAdd, task, userPrefs }) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    difficulty: 'moyen',
    estimated_minutes: 30,
    due_date: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        subject: task.subject || '',
        description: task.description || '',
        difficulty: task.difficulty || 'moyen',
        estimated_minutes: task.estimated_minutes || 30,
        due_date: task.due_date || ''
      });
    } else {
      setFormData({
        title: '',
        subject: '',
        description: '',
        difficulty: 'moyen',
        estimated_minutes: calculateEstimatedMinutes('moyen', userPrefs?.class_level || 'troisieme'),
        due_date: ''
      });
    }
  }, [task, open, userPrefs]);

  const subjects = getSubjectsForLevel(
    userPrefs?.class_level || 'troisieme',
    userPrefs?.specialties || []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject) return;
    
    onAdd({
      ...formData,
      source: task ? task.source : 'manuel',
      status: task ? task.status : 'a_faire',
      priority: formData.difficulty === 'difficile' ? 8 : formData.difficulty === 'moyen' ? 5 : 3
    });
    
    if (!task) {
      setFormData({
        title: '',
        subject: '',
        description: '',
        difficulty: 'moyen',
        estimated_minutes: calculateEstimatedMinutes('moyen', userPrefs?.class_level || 'troisieme'),
        due_date: ''
      });
    }
    onOpenChange(false);
  };

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${minutes} min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
              {task ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la tâche</Label>
            <Input
              id="title"
              placeholder="Ex: Réviser le chapitre 3"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Matière</Label>
            <Select 
              value={formData.subject} 
              onValueChange={(value) => setFormData({ ...formData, subject: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choisir une matière" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Difficulté</Label>
            <div className="flex gap-2">
              {[
                { value: 'facile', label: 'Facile', color: 'bg-emerald-500' },
                { value: 'moyen', label: 'Moyen', color: 'bg-amber-500' },
                { value: 'difficile', label: 'Difficile', color: 'bg-rose-500' }
              ].map((diff) => (
                <Button
                  key={diff.value}
                  type="button"
                  variant={formData.difficulty === diff.value ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, difficulty: diff.value })}
                  className={formData.difficulty === diff.value ? diff.color : ""}
                >
                  {diff.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Temps estimé</Label>
              <span className="text-sm font-medium text-violet-600">
                {formatTime(formData.estimated_minutes)}
              </span>
            </div>
            <Slider
              value={[formData.estimated_minutes]}
              onValueChange={([value]) => setFormData({ ...formData, estimated_minutes: value })}
              min={15}
              max={180}
              step={15}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>15 min</span>
              <span>3h</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due_date">Date limite (optionnel)</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Détails supplémentaires..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {task ? 'Enregistrer' : 'Ajouter la tâche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}