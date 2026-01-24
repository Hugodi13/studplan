import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

export default function MoveSessionModal({ open, onOpenChange, session, onMove }) {
  const [selectedDate, setSelectedDate] = useState(
    session ? new Date(session.scheduled_date) : new Date()
  );

  const handleMove = () => {
    if (selectedDate && session) {
      onMove(session.id, format(selectedDate, 'yyyy-MM-dd'));
      onOpenChange(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            Déplacer la session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-sm font-medium text-slate-700">{session.task_title}</p>
            <p className="text-xs text-slate-500 mt-1">
              {session.duration_minutes} min • {session.task_subject}
            </p>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={fr}
            className="rounded-md border"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleMove} className="bg-violet-600 hover:bg-violet-700">
            Déplacer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}