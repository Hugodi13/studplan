import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar, Sparkles, Loader2, Clock, Target, Repeat } from "lucide-react";
import { addDays, format, differenceInDays, isWeekend, setHours, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

export default function PlanningGenerator({ open, onOpenChange, tasks, onGenerate, userPrefs }) {
  const [daysCount, setDaysCount] = useState(7);
  const [dailyMinutes, setDailyMinutes] = useState(90);
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [includeSunday, setIncludeSunday] = useState(userPrefs?.include_sunday || false);
  const [useForgettingCurve, setUseForgettingCurve] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const pendingTasks = tasks.filter(t => t.status !== 'termine');
  const totalMinutes = pendingTasks.reduce((sum, t) => sum + (t.estimated_minutes || 30), 0);
  
  const availableDays = includeWeekends ? daysCount : Math.floor(daysCount * 5 / 7);
  const totalAvailableMinutes = availableDays * dailyMinutes;
  const isFeasible = totalAvailableMinutes >= totalMinutes;

  const generatePlanning = async () => {
    setIsGenerating(true);
    
    // Sort tasks by priority (due date + difficulty)
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const aUrgency = a.due_date ? differenceInDays(new Date(a.due_date), new Date()) : 999;
      const bUrgency = b.due_date ? differenceInDays(new Date(b.due_date), new Date()) : 999;
      const aPriority = (a.priority || 5) + (10 - Math.min(aUrgency, 10));
      const bPriority = (b.priority || 5) + (10 - Math.min(bUrgency, 10));
      return bPriority - aPriority;
    });

    const sessions = [];
    const now = new Date();
    const currentHour = now.getHours();
    const studyStartHour = userPrefs?.study_start_hour || 17;
    
    // Skip today if it's already late
    let currentDay = currentHour >= studyStartHour + 2 ? 1 : 0;
    let remainingMinutesToday = currentDay === 0 
      ? Math.max(0, dailyMinutes - ((currentHour - studyStartHour) * 60))
      : dailyMinutes;
    
    for (const task of sortedTasks) {
      let taskMinutes = task.estimated_minutes || 30;
      
      // Add spaced repetition sessions
      const needsReview = task.due_date && differenceInDays(new Date(task.due_date), new Date()) > 2;
      
      while (taskMinutes > 0 && currentDay < daysCount) {
        const scheduledDate = addDays(new Date(), currentDay);

        // Skip weekends if not included
        if (!includeWeekends && isWeekend(scheduledDate)) {
          currentDay++;
          remainingMinutesToday = dailyMinutes;
          continue;
        }

        // Skip Sunday if not included
        if (!includeSunday && scheduledDate.getDay() === 0) {
          currentDay++;
          remainingMinutesToday = dailyMinutes;
          continue;
        }
        
        const sessionDuration = Math.min(taskMinutes, remainingMinutesToday, 60);
        
        if (sessionDuration >= 15) {
          sessions.push({
            task_id: task.id,
            scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
            duration_minutes: sessionDuration,
            start_time: getStartTime(dailyMinutes - remainingMinutesToday, studyStartHour),
            completed: false,
            task_title: task.title,
            task_subject: task.subject,
            task_difficulty: task.difficulty
          });
          
          taskMinutes -= sessionDuration;
          remainingMinutesToday -= sessionDuration;
        }
        
        if (remainingMinutesToday < 15) {
          currentDay++;
          remainingMinutesToday = dailyMinutes;
        }
      }
      
      // Add spaced-repetition reviews (forgetting curve).
      if (needsReview && task.due_date && useForgettingCurve) {
        const dueDate = new Date(task.due_date);
        const nowDate = new Date();
        const daysUntilDue = Math.max(0, differenceInDays(dueDate, nowDate));
        const offsets = daysUntilDue >= 10 ? [7, 3, 1] : daysUntilDue >= 5 ? [3, 1] : [1];

        offsets.forEach((offset, idx) => {
          const reviewDate = addDays(dueDate, -offset);
          if (!isBefore(nowDate, reviewDate)) return;
          if (!includeWeekends && isWeekend(reviewDate)) return;
          if (!includeSunday && reviewDate.getDay() === 0) return;

          sessions.push({
            task_id: task.id,
            scheduled_date: format(reviewDate, 'yyyy-MM-dd'),
            duration_minutes: 15 + (idx === offsets.length - 1 ? 10 : 0),
            start_time: getStartTime(0, studyStartHour),
            completed: false,
            task_title: `🧠 Révision J-${offset}: ${task.title}`,
            task_subject: task.subject,
            task_difficulty: task.difficulty,
            is_review: true,
            review_stage: `J-${offset}`,
          });
        });
      } else if (needsReview && task.due_date) {
        // Fallback simple review the day before due date.
        const reviewDate = addDays(new Date(task.due_date), -1);
        if (isBefore(new Date(), reviewDate)) {
          sessions.push({
            task_id: task.id,
            scheduled_date: format(reviewDate, 'yyyy-MM-dd'),
            duration_minutes: 20,
            start_time: getStartTime(0, studyStartHour),
            completed: false,
            task_title: `📚 Révision: ${task.title}`,
            task_subject: task.subject,
            task_difficulty: task.difficulty,
            is_review: true
          });
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsGenerating(false);
    onGenerate(sessions);
    onOpenChange(false);
  };

  const getStartTime = (minutesElapsed, baseHour = 17) => {
    const hours = baseHour + Math.floor(minutesElapsed / 60);
    const minutes = minutesElapsed % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            Générer mon planning
          </DialogTitle>
          <DialogDescription>
            L'IA va créer un planning optimisé selon tes disponibilités
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
              <div className="flex items-center gap-2 text-violet-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Tâches à planifier</span>
              </div>
              <p className="text-2xl font-bold text-violet-700">{pendingTasks.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Temps total estimé</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{formatDuration(totalMinutes)}</p>
            </div>
          </div>

          {/* Days slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Sur combien de jours ?</Label>
              <span className="text-sm font-semibold text-emerald-600">{daysCount} jours</span>
            </div>
            <Slider
              value={[daysCount]}
              onValueChange={([value]) => setDaysCount(value)}
              min={3}
              max={30}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>3 jours</span>
              <span>1 mois</span>
            </div>
          </div>

          {/* Daily minutes slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Temps de révision par jour</Label>
              <span className="text-sm font-semibold text-emerald-600">{formatDuration(dailyMinutes)}</span>
            </div>
            <Slider
              value={[dailyMinutes]}
              onValueChange={([value]) => setDailyMinutes(value)}
              min={30}
              max={240}
              step={15}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>30 min</span>
              <span>4h</span>
            </div>
          </div>

          {/* Weekends toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div>
              <p className="font-medium text-slate-700">Inclure les weekends</p>
              <p className="text-sm text-slate-500">Réviser aussi samedi et dimanche</p>
            </div>
            <Button
              variant={includeWeekends ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeWeekends(!includeWeekends)}
              className={includeWeekends ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {includeWeekends ? "Oui" : "Non"}
            </Button>
          </div>

          {/* Sunday toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div>
              <p className="font-medium text-slate-700">Inclure le dimanche</p>
              <p className="text-sm text-slate-500">Travailler aussi le dimanche</p>
            </div>
            <Button
              variant={includeSunday ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeSunday(!includeSunday)}
              className={includeSunday ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {includeSunday ? "Oui" : "Non"}
            </Button>
          </div>

          {/* Feasibility check */}
          <div className={`p-4 rounded-xl ${isFeasible ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-sm ${isFeasible ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isFeasible 
                ? `✓ Tu auras ${formatDuration(totalAvailableMinutes)} de disponible, c'est suffisant !`
                : `⚠ Attention: tu n'auras que ${formatDuration(totalAvailableMinutes)} mais il te faut ${formatDuration(totalMinutes)}. Augmente les jours ou le temps quotidien.`
              }
            </p>
          </div>

          {/* Forgetting curve / spaced repetition */}
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 space-y-3">
            <div className="flex items-start gap-3">
              <Repeat className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-violet-700">Courbe de l’oubli (révision espacée)</p>
                <p className="text-xs text-violet-600 mt-1">
                  Active des rappels J-7 / J-3 / J-1 (selon délai avant devoir) pour mieux retenir sur la durée.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={useForgettingCurve ? "default" : "outline"}
                size="sm"
                onClick={() => setUseForgettingCurve(!useForgettingCurve)}
                className={useForgettingCurve ? "bg-violet-600 hover:bg-violet-700" : ""}
              >
                {useForgettingCurve ? "Activée" : "Désactivée"}
              </Button>
              <p className="text-xs text-violet-700">Mémorisation long terme</p>
            </div>
            <div className="rounded-lg bg-white/70 border border-violet-100 p-2">
              <div className="flex items-end gap-1 h-10">
                <div className="w-2 rounded-t bg-violet-500 h-9" />
                <div className="w-2 rounded-t bg-violet-400 h-6" />
                <div className="w-2 rounded-t bg-violet-300 h-4" />
                <div className="w-2 rounded-t bg-violet-500 h-7" />
                <div className="w-2 rounded-t bg-violet-300 h-4" />
                <div className="w-2 rounded-t bg-violet-500 h-8" />
              </div>
              <p className="text-[11px] text-violet-700 mt-1">Pic de rappel à chaque révision (J-7, J-3, J-1)</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={generatePlanning}
            disabled={pendingTasks.length === 0 || isGenerating}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer le planning
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}