import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function RewardBadge({ reward }) {
  if (!reward) return null;

  const getLevelInfo = (level) => {
    if (level < 5) return { name: "Débutant", color: "from-slate-400 to-slate-500" };
    if (level < 10) return { name: "Motivé", color: "from-blue-400 to-blue-500" };
    if (level < 20) return { name: "Assidu", color: "from-violet-400 to-violet-500" };
    if (level < 30) return { name: "Expert", color: "from-amber-400 to-amber-500" };
    return { name: "Légende", color: "from-rose-400 to-rose-500" };
  };

  const levelInfo = getLevelInfo(reward.level || 1);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-violet-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${levelInfo.color}`}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800">Niveau {reward.level}</span>
                <Badge className={`bg-gradient-to-r ${levelInfo.color} text-white border-0`}>
                  {levelInfo.name}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{reward.points} points</p>
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
  );
}