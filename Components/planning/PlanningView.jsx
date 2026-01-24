import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, BookOpen, ChevronLeft, ChevronRight, MoveRight } from "lucide-react";
import { format, addDays, isSameDay, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const difficultyColors = {
  facile: "bg-emerald-100 text-emerald-700",
  moyen: "bg-amber-100 text-amber-700",
  difficile: "bg-rose-100 text-rose-700"
};

export default function PlanningView({ sessions, onToggleComplete, onMoveSession, selectedDate, onDateChange }) {
  const getDayLabel = (date) => {
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, "EEEE d MMMM", { locale: fr });
  };

  const daySessions = sessions.filter(s => 
    isSameDay(new Date(s.scheduled_date), selectedDate)
  );

  const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const completedMinutes = daySessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration_minutes, 0);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  // Get dates with sessions for navigation
  const datesWithSessions = [...new Set(sessions.map(s => s.scheduled_date))].sort();

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(addDays(selectedDate, -1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {getDayLabel(selectedDate)}
          </h2>
          <p className="text-sm text-slate-500">
            {format(selectedDate, "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress bar */}
      {daySessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-violet-700">Progression du jour</span>
            <span className="text-sm text-violet-600">{formatTime(completedMinutes)} / {formatTime(totalMinutes)}</span>
          </div>
          <div className="h-2 bg-violet-200/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3">
        {daySessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Aucune session prévue ce jour</p>
            <p className="text-sm text-slate-400 mt-1">
              Génère un planning pour remplir ton agenda
            </p>
          </div>
        ) : (
          daySessions.map((session, index) => (
            <Card
              key={session.id || index}
              className={cn(
                "p-4 transition-all duration-300 hover:shadow-md",
                "border border-slate-200/60",
                session.completed && "bg-slate-50 opacity-70"
              )}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <button
                  onClick={() => onToggleComplete(session)}
                  className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                >
                  {session.completed ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-500">{session.start_time}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">{formatTime(session.duration_minutes)}</span>
                    {session.is_review && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                        Révision
                      </span>
                    )}
                  </div>
                  
                  <h3 className={cn(
                    "font-semibold text-slate-800",
                    session.completed && "line-through text-slate-500"
                  )}>
                    {session.task_title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {session.task_subject}
                    </Badge>
                    {session.task_difficulty && (
                      <Badge variant="outline" className={`${difficultyColors[session.task_difficulty]} text-xs`}>
                        {session.task_difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSession(session);
                  }}
                  className="flex-shrink-0 ml-auto sm:ml-0"
                >
                  <MoveRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick date navigation */}
      {datesWithSessions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-4 border-t border-slate-100">
          {datesWithSessions.slice(0, 7).map((dateStr) => {
            const date = new Date(dateStr);
            const daySessionCount = sessions.filter(s => s.scheduled_date === dateStr).length;
            const isSelected = isSameDay(date, selectedDate);
            
            return (
              <Button
                key={dateStr}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onDateChange(date)}
                className={cn(
                  "flex-shrink-0 flex-col h-auto py-2 px-3",
                  isSelected && "bg-violet-600 hover:bg-violet-700"
                )}
              >
                <span className="text-xs opacity-70">
                  {format(date, "EEE", { locale: fr })}
                </span>
                <span className="text-lg font-bold">
                  {format(date, "d")}
                </span>
                <span className="text-xs opacity-70">
                  {daySessionCount} session{daySessionCount > 1 ? 's' : ''}
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}