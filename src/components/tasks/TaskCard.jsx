import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Trash2, CheckCircle2, Circle, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

const difficultyConfig = {
  facile: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Facile" },
  moyen: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Moyen" },
  difficile: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Difficile" }
};

const statusIcons = {
  a_faire: Circle,
  en_cours: Clock,
  termine: CheckCircle2
};

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const difficulty = difficultyConfig[task.difficulty] || difficultyConfig.moyen;
  const StatusIcon = statusIcons[task.status] || Circle;
  
  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h${m}min` : `${h}h`;
    }
    return `${minutes}min`;
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      "border border-slate-200/60 bg-white/80 backdrop-blur-sm",
      task.status === 'termine' && "opacity-60"
    )}>
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-indigo-500" />
      
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <button 
                type="button"
                onClick={() => onStatusChange(task, task.status === 'termine' ? 'a_faire' : 'termine')}
                className="flex-shrink-0 min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl active:scale-95 transition-transform sm:hover:scale-110 touch-manipulation"
                aria-label={task.status === 'termine' ? 'Marquer à faire' : 'Marquer terminé'}
              >
                <StatusIcon className={cn(
                  "w-6 h-6",
                  task.status === 'termine' ? "text-emerald-500" : "text-slate-400"
                )} />
              </button>
              <h3 className={cn(
                "font-semibold text-slate-800 truncate",
                task.status === 'termine' && "line-through text-slate-500"
              )}>
                {task.title}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                <BookOpen className="w-3 h-3 mr-1" />
                {task.subject}
              </Badge>
              
              <Badge variant="outline" className={difficulty.color}>
                {difficulty.label}
              </Badge>
              
              {task.estimated_minutes && (
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(task.estimated_minutes)}
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(task)}
              className="text-slate-600 hover:text-violet-600 hover:border-violet-300 border-slate-200 bg-white/90 h-12 w-12 min-h-[48px] min-w-[48px] touch-manipulation shadow-sm"
              aria-label="Modifier la tâche"
            >
              <Edit3 className="w-6 h-6 shrink-0" strokeWidth={2.25} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(task)}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-300 border-slate-200 bg-white/90 h-12 w-12 min-h-[48px] min-w-[48px] touch-manipulation shadow-sm"
              aria-label="Supprimer la tâche"
            >
              <Trash2 className="w-6 h-6 shrink-0" strokeWidth={2.25} />
            </Button>
          </div>
        </div>
        
        {task.due_date && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              À rendre le <span className="font-medium text-slate-700">
                {new Date(task.due_date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}