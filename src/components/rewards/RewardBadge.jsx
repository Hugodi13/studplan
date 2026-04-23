import React, { useMemo, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Flame, Target, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RewardBadge({ reward }) {
  if (!reward) return null;
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const getLevelInfo = (level) => {
    if (level < 5) return { name: "Débutant", color: "from-slate-400 to-slate-500" };
    if (level < 10) return { name: "Motivé", color: "from-blue-400 to-blue-500" };
    if (level < 20) return { name: "Assidu", color: "from-violet-400 to-violet-500" };
    if (level < 30) return { name: "Expert", color: "from-amber-400 to-amber-500" };
    return { name: "Légende", color: "from-rose-400 to-rose-500" };
  };

  const levelInfo = getLevelInfo(reward.level || 1);
  const nextLevelPoints = useMemo(() => ((reward.level || 1) * 100), [reward.level]);

  const handleShare = async () => {
    const appUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_SHARE_URL) ||
      'https://studyplan-c9w.pages.dev';
    const txt = `🏆 Je suis niveau ${reward.level} (${levelInfo.name}) sur StudPlan avec ${reward.points} points 🔥 Viens me battre ! ${appUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: txt, title: 'Mon score StudPlan' });
      } else {
        await navigator.clipboard.writeText(txt);
        alert('Message copié, tu peux le coller où tu veux.');
      }
    } catch {
      // user canceled share
    }
  };

  return (
    <>
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="reward-surface p-4 bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-violet-200 cursor-pointer"
        onClick={() => setShowLevelInfo(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${levelInfo.color}`}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800 reward-title">Niveau {reward.level}</span>
                <Badge className={`bg-gradient-to-r ${levelInfo.color} text-white border-0`}>
                  {levelInfo.name}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 reward-subtext">{reward.points} points</p>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-lg font-bold">{reward.current_streak}</span>
              </div>
              <p className="text-xs text-slate-500">série</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-lg font-bold">{reward.total_tasks_completed}</span>
              </div>
              <p className="text-xs text-slate-500">tâches</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
    <Dialog open={showLevelInfo} onOpenChange={setShowLevelInfo}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Niveaux et progression</DialogTitle>
          <DialogDescription>
            Niveau actuel: {reward.level} ({levelInfo.name}). Objectif suivant: {nextLevelPoints} points.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-slate-700">
          <p>• Débutant: niveaux 1 à 4</p>
          <p>• Motivé: niveaux 5 à 9</p>
          <p>• Assidu: niveaux 10 à 19</p>
          <p>• Expert: niveaux 20 à 29</p>
          <p>• Légende: niveau 30+</p>
          <p className="text-xs text-slate-500 pt-1">
            La régularité est récompensée. Si tu n’as pas de tâche un jour, ta série n’est pas cassée.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleShare} className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Partager mon score
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}