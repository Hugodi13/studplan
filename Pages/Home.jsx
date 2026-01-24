import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Upload, Calendar, ListTodo, Sparkles, Settings as SettingsIcon, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import TaskCard from "@/components/tasks/TaskCard";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import ImportTasksModal from "@/components/tasks/ImportTasksModal";
import PlanningGenerator from "@/components/planning/PlanningGenerator";
import PlanningView from "@/components/planning/PlanningView";
import OnboardingModal from "@/components/setup/OnboardingModal";
import ConnectPronoteModal from "@/components/setup/ConnectPronoteModal";
import SettingsModal from "@/components/settings/SettingsModal";
import RewardBadge from "@/components/rewards/RewardBadge";
import PremiumModal from "@/components/premium/PremiumModal";
import InstallPrompt from "@/components/InstallPrompt";
import MoveSessionModal from "@/components/planning/MoveSessionModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [generatedSessions, setGeneratedSessions] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConnectPronote, setShowConnectPronote] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [movingSession, setMovingSession] = useState(null);
  
  const queryClient = useQueryClient();

  // Fetch current user first
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch tasks (filtered by user)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', currentUser?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: currentUser.email }, '-created_date'),
    enabled: !!currentUser?.email
  });

  // Fetch saved sessions (filtered by user)
  const { data: savedSessions = [] } = useQuery({
    queryKey: ['sessions', currentUser?.email],
    queryFn: () => base44.entities.StudySession.filter({ created_by: currentUser.email }, '-scheduled_date'),
    enabled: !!currentUser?.email
  });

  // Fetch user preferences (filtered by user)
  const { data: userPrefs = null, isLoading: prefsLoading } = useQuery({
    queryKey: ['userPreferences', currentUser?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ created_by: currentUser.email });
      return prefs[0] || null;
    },
    enabled: !!currentUser?.email
  });

  // Fetch user rewards (filtered by user)
  const { data: reward = null } = useQuery({
    queryKey: ['reward', currentUser?.email],
    queryFn: async () => {
      const rewards = await base44.entities.Reward.filter({ created_by: currentUser.email });
      return rewards[0] || null;
    },
    enabled: !!currentUser?.email
  });

  // Fetch subscription (filtered by user)
  const { data: subscription = null } = useQuery({
    queryKey: ['subscription', currentUser?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
      return subs[0] || null;
    },
    enabled: !!currentUser?.email
  });

  const isPremium = subscription?.plan === 'premium' && subscription?.is_active;

  // Show onboarding if no preferences
  useEffect(() => {
    if (!prefsLoading && !userPrefs) {
      setShowOnboarding(true);
    }
  }, [userPrefs, prefsLoading]);

  // Auto-reschedule past incomplete sessions
  useEffect(() => {
    const rescheduleOldSessions = async () => {
      const today = new Date().toISOString().split('T')[0];
      const pastSessions = savedSessions.filter(s => 
        !s.completed && new Date(s.scheduled_date) < new Date(today)
      );

      for (const session of pastSessions) {
        // Move to next available day
        let newDate = new Date();
        newDate.setDate(newDate.getDate() + 1);
        
        // Skip Sunday if not included in preferences
        if (!userPrefs?.include_sunday && newDate.getDay() === 0) {
          newDate.setDate(newDate.getDate() + 1);
        }

        await updateSession.mutateAsync({
          id: session.id,
          data: { scheduled_date: newDate.toISOString().split('T')[0] }
        });
      }
    };

    if (savedSessions.length > 0 && userPrefs) {
      rescheduleOldSessions();
    }
  }, [savedSessions.length]);

  // Mutations
  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const bulkCreateTasks = useMutation({
    mutationFn: (data) => base44.entities.Task.bulkCreate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId) => {
      // Delete associated sessions first
      const sessionsToDelete = savedSessions.filter(s => s.task_id === taskId);
      for (const session of sessionsToDelete) {
        await base44.entities.StudySession.delete(session.id);
      }
      // Then delete the task
      await base44.entities.Task.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const bulkCreateSessions = useMutation({
    mutationFn: (data) => base44.entities.StudySession.bulkCreate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const updateSession = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StudySession.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const createPreferences = useMutation({
    mutationFn: (data) => base44.entities.UserPreferences.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
  });

  const updatePreferences = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserPreferences.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
  });

  const createReward = useMutation({
    mutationFn: (data) => base44.entities.Reward.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward'] })
  });

  const updateReward = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reward.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward'] })
  });

  const handleStatusChange = async (task, newStatus) => {
    await updateTask.mutateAsync({ id: task.id, data: { status: newStatus } });
    
    // Update rewards when task is completed
    if (newStatus === 'termine') {
      await updateRewardProgress();
    }
  };

  const updateRewardProgress = async () => {
    if (!reward) {
      // Create initial reward
      await createReward.mutateAsync({
        points: 10,
        total_tasks_completed: 1,
        current_streak: 1,
        best_streak: 1,
        last_activity_date: new Date().toISOString().split('T')[0],
        level: 1
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = reward.last_activity_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const newStreak = lastDate === yesterday ? reward.current_streak + 1 : 
                        lastDate === today ? reward.current_streak : 1;
      
      const newPoints = reward.points + 10;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      await updateReward.mutateAsync({
        id: reward.id,
        data: {
          points: newPoints,
          total_tasks_completed: reward.total_tasks_completed + 1,
          current_streak: newStreak,
          best_streak: Math.max(reward.best_streak, newStreak),
          last_activity_date: today,
          level: newLevel
        }
      });
    }
  };

  const handleDeleteTask = (task) => {
    deleteTask.mutate(task.id);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowAddTask(true);
  };

  const handleSaveTask = (taskData) => {
    // Check free plan limit (10 tasks)
    if (!isPremium && tasks.length >= 10 && !editingTask) {
      setShowPremium(true);
      return;
    }

    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data: taskData });
      setEditingTask(null);
    } else {
      createTask.mutate(taskData);
    }
  };

  const handleImportTasks = (importedTasks) => {
    bulkCreateTasks.mutate(importedTasks);
  };

  const handleOnboardingComplete = (prefsData) => {
    createPreferences.mutate(prefsData);
    setShowOnboarding(false);
  };

  const handleConnectPronote = async (credentials) => {
    if (userPrefs?.id) {
      await updatePreferences.mutateAsync({ id: userPrefs.id, data: credentials });
    }
  };

  const handleUpdatePrefs = async (prefsData) => {
    if (userPrefs?.id) {
      await updatePreferences.mutateAsync({ id: userPrefs.id, data: prefsData });
    }
  };

  const handleUpgradeToPremium = () => {
    // Redirect to Stripe checkout
    window.open('https://buy.stripe.com/test_YOUR_PAYMENT_LINK', '_blank');
    setShowPremium(false);
  };

  const handleGeneratePlanning = async (sessions) => {
    // Enrich sessions with task info
    const enrichedSessions = sessions.map(s => ({
      task_id: s.task_id,
      scheduled_date: s.scheduled_date,
      duration_minutes: s.duration_minutes,
      start_time: s.start_time,
      completed: false
    }));
    
    await bulkCreateSessions.mutateAsync(enrichedSessions);
    setGeneratedSessions(sessions);
    setActiveTab('planning');
  };

  const handleToggleSession = (session) => {
    if (session.id) {
      updateSession.mutate({ id: session.id, data: { completed: !session.completed } });
    }
  };

  const handleMoveSession = async (sessionId, newDate) => {
    await updateSession.mutateAsync({ 
      id: sessionId, 
      data: { scheduled_date: newDate }
    });
    setSelectedDate(new Date(newDate));
  };

  // Merge saved sessions with task info
  const sessionsWithTaskInfo = savedSessions.map(session => {
    const task = tasks.find(t => t.id === session.task_id);
    return {
      ...session,
      task_title: task?.title || 'Tâche supprimée',
      task_subject: task?.subject || '',
      task_difficulty: task?.difficulty
    };
  });

  const pendingTasks = tasks.filter(t => t.status !== 'termine');
  const completedTasks = tasks.filter(t => t.status === 'termine');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                StudyPlan
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Ton planning de révisions intelligent</p>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-xl h-9 w-9"
              >
                <SettingsIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowImport(true)}
                className="rounded-xl h-9 w-9"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowAddTask(true)}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-9"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-11 sm:h-12 p-1 bg-slate-100/80 rounded-xl">
            <TabsTrigger value="tasks" className="rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Mes tâches</span>
              <span className="sm:hidden">Tâches</span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
              <Calendar className="w-4 h-4" />
              Planning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 sm:space-y-6 mt-0">
            {/* Premium CTA for free users */}
            {!isPremium && tasks.length >= 5 && (
              <Card className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowPremium(true)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-amber-900 text-sm sm:text-base">Premium 1€/mois</p>
                      <p className="text-xs sm:text-sm text-amber-700">Illimité + Sync complète</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs sm:text-sm flex-shrink-0">
                    Voir
                  </Button>
                </div>
              </Card>
            )}

            {/* Reward badge */}
            {reward && <RewardBadge reward={reward} />}

            {/* Generate planning button */}
            {pendingTasks.length > 0 && (
              <Button
                onClick={() => setShowPlanning(true)}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200/50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Générer mon planning de révisions
              </Button>
            )}

            {/* Tasks list */}
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                  <ListTodo className="w-10 h-10 text-violet-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">
                  Aucune tâche pour l'instant
                </h2>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Ajoute tes devoirs manuellement ou importe-les depuis Pronote / École Directe
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setShowAddTask(true)} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une tâche
                  </Button>
                  <Button variant="outline" onClick={() => setShowImport(true)} className="rounded-xl">
                    <Upload className="w-4 h-4 mr-2" />
                    Importer
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      À faire ({pendingTasks.length})
                    </h3>
                    {pendingTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                      />
                    ))}
                  </div>
                )}

                {completedTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Terminé ({completedTasks.length})
                    </h3>
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="planning" className="mt-0">
            <PlanningView
              sessions={sessionsWithTaskInfo}
              onToggleComplete={handleToggleSession}
              onMoveSession={setMovingSession}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      
      <AddTaskModal 
        open={showAddTask} 
        onOpenChange={(open) => {
          setShowAddTask(open);
          if (!open) setEditingTask(null);
        }}
        onAdd={handleSaveTask}
        task={editingTask}
        userPrefs={userPrefs}
      />
      
      <ImportTasksModal
        open={showImport}
        onOpenChange={setShowImport}
        onImport={handleImportTasks}
        userPrefs={userPrefs}
      />
      
      <PlanningGenerator
        open={showPlanning}
        onOpenChange={setShowPlanning}
        tasks={tasks}
        onGenerate={handleGeneratePlanning}
        userPrefs={userPrefs}
      />

      <ConnectPronoteModal
        open={showConnectPronote}
        onOpenChange={setShowConnectPronote}
        onConnect={handleConnectPronote}
      />

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        userPrefs={userPrefs}
        onUpdatePrefs={handleUpdatePrefs}
      />

      <PremiumModal
        open={showPremium}
        onOpenChange={setShowPremium}
        onUpgrade={handleUpgradeToPremium}
      />

      <InstallPrompt />

      <MoveSessionModal
        open={!!movingSession}
        onOpenChange={(open) => !open && setMovingSession(null)}
        session={movingSession}
        onMove={handleMoveSession}
      />

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-3 sm:px-4 py-6 mt-8 border-t border-slate-200">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} StudyPlan - Tous droits réservés
          <br />
          Application créée par <span className="font-semibold text-slate-700">Hugo Di Chiara</span>
        </p>
      </footer>
    </div>
  );
}