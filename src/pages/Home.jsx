import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { studyplanApi } from "@/api/studyplanClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Calendar, ListTodo, Sparkles, Settings as SettingsIcon, Crown, School, GraduationCap, Power, CheckCircle2, Camera, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import AdBanner from "@/components/ads/AdBanner";
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
import { getFreeTaskSlotsToday, isFreePlanDailyQuotaReached } from "@/lib/freePlanUtils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/I18nContext";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setLocale, t } = useI18n();
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState('photo');
  const [showAddChooser, setShowAddChooser] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [generatedSessions, setGeneratedSessions] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConnectPronote, setShowConnectPronote] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showFounderWelcome, setShowFounderWelcome] = useState(false);
  const [movingSession, setMovingSession] = useState(null);
  /** Flux import PDF depuis la modale Pronote / École Directe (quota 14 j en gratuit) */
  const [schoolPdfSource, setSchoolPdfSource] = useState(null);

  const queryClient = useQueryClient();

  // User session (tous les hooks doivent rester avant tout return)
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => studyplanApi.auth.me(),
  });

  // Fetch tasks (filtered by user)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', currentUser?.email],
    queryFn: () => {
      const email = currentUser?.email
      if (!email) return []
      return studyplanApi.entities.Task.filter({ created_by: email }, '-created_date')
    },
    enabled: !!currentUser?.email,
  });

  // Fetch saved sessions (filtered by user)
  const { data: savedSessions = [] } = useQuery({
    queryKey: ['sessions', currentUser?.email],
    queryFn: () => {
      const email = currentUser?.email
      if (!email) return []
      return studyplanApi.entities.StudySession.filter({ created_by: email }, '-scheduled_date')
    },
    enabled: !!currentUser?.email,
  });

  // Fetch user preferences (filtered by user)
  const { data: userPrefs = null, isLoading: prefsLoading } = useQuery({
    queryKey: ['userPreferences', currentUser?.email],
    queryFn: async () => {
      const email = currentUser?.email
      if (!email) return null
      const prefs = await studyplanApi.entities.UserPreferences.filter({ created_by: email });
      return prefs[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  // Fetch user rewards (filtered by user)
  const { data: reward = null } = useQuery({
    queryKey: ['reward', currentUser?.email],
    queryFn: async () => {
      const email = currentUser?.email
      if (!email) return null
      const rewards = await studyplanApi.entities.Reward.filter({ created_by: email });
      return rewards[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  // Fetch subscription (filtered by user)
  const { data: subscription = null } = useQuery({
    queryKey: ['subscription', currentUser?.email],
    queryFn: async () => {
      const email = currentUser?.email
      if (!email) return null
      return studyplanApi.billing.getCurrentSubscription(email)
    },
    enabled: !!currentUser?.email,
  });

  const isPremium =
    Boolean(subscription?.is_active) &&
    (subscription?.plan === 'premium' || Boolean(subscription?.is_founder));
  const isPaypal = Boolean(
    isPremium && subscription?.payment_provider === 'paypal' && subscription?.is_active
  );

  useEffect(() => {
    if (!currentUser?.id || !subscription?.is_founder) return;
    const key = `studyplan:founder-welcome:${currentUser.id}`;
    try {
      if (localStorage.getItem(key) === '1') return;
      localStorage.setItem(key, '1');
      setShowFounderWelcome(true);
    } catch {
      setShowFounderWelcome(true);
    }
  }, [currentUser?.id, subscription?.is_founder]);

  const openAddTask = () => {
    if (!isPremium && isFreePlanDailyQuotaReached(tasks, isPremium)) {
      setShowPremium(true);
      return;
    }
    setShowAddChooser(true);
  };

  const openManualAdd = () => {
    setShowAddChooser(false);
    setShowAddTask(true);
  };

  const openImportTab = (tab, opts = {}) => {
    setShowAddChooser(false);
    setImportTab(tab === 'text' ? 'text' : tab === 'pdf' ? 'pdf' : 'photo');
    if (tab === 'pdf' && opts.schoolPdf && (opts.source === 'pronote' || opts.source === 'ecoledirecte')) {
      setSchoolPdfSource(opts.source);
    } else {
      setSchoolPdfSource(null);
    }
    setShowImport(true);
  };

  // Onboarding = première config (niveau / spé). Ne pas re-demander si déjà enregistré
  useEffect(() => {
    if (!currentUser?.email) return
    if (prefsLoading) return
    if (!userPrefs) {
      setShowOnboarding(true)
      return
    }
    const hasLevel = Boolean(userPrefs.class_level)
    const done = userPrefs.onboarding_completed === true
    if (done || hasLevel) {
      setShowOnboarding(false)
    } else {
      setShowOnboarding(true)
    }
  }, [userPrefs, prefsLoading, currentUser?.email])

  useEffect(() => {
    if (userPrefs?.locale) setLocale(userPrefs.locale)
  }, [userPrefs?.locale, setLocale])

  // Retour paiement (ex. ?billing=paypal) : activer Premium
  useEffect(() => {
    const b = searchParams.get('billing')
    if ((b === 'paypal' || b === 'success') && import.meta.env.DEV) {
      void (async () => {
        try {
          await studyplanApi.billing.activatePaypalPremium({ orderId: searchParams.get('orderId') || undefined })
        } catch { /* */ }
      })()
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      const next = new URLSearchParams(searchParams)
      next.delete('billing')
      next.delete('orderId')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, queryClient])

  // Auto-reschedule past incomplete sessions
  useEffect(() => {
    if (!currentUser?.email || !userPrefs) return;

    const rescheduleOldSessions = async () => {
      const today = new Date().toISOString().split('T')[0];
      const pastSessions = savedSessions.filter(s => 
        !s.completed && new Date(s.scheduled_date) < new Date(today)
      );

      for (const session of pastSessions) {
        let newDate = new Date();
        newDate.setDate(newDate.getDate() + 1);
        
        if (!userPrefs?.include_sunday && newDate.getDay() === 0) {
          newDate.setDate(newDate.getDate() + 1);
        }

        await updateSession.mutateAsync({
          id: session.id,
          data: { scheduled_date: newDate.toISOString().split('T')[0] }
        });
      }
    };

    if (savedSessions.length > 0) {
      rescheduleOldSessions();
    }
  }, [savedSessions.length, currentUser?.email, userPrefs]);

  // Mutations
  const createTask = useMutation({
    mutationFn: (data) => studyplanApi.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const bulkCreateTasks = useMutation({
    mutationFn: (data) => studyplanApi.entities.Task.bulkCreate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => studyplanApi.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId) => {
      // Delete associated sessions first
      const sessionsToDelete = savedSessions.filter(s => s.task_id === taskId);
      for (const session of sessionsToDelete) {
        await studyplanApi.entities.StudySession.delete(session.id);
      }
      // Then delete the task
      await studyplanApi.entities.Task.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const bulkCreateSessions = useMutation({
    mutationFn: (data) => studyplanApi.entities.StudySession.bulkCreate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const updateSession = useMutation({
    mutationFn: ({ id, data }) => studyplanApi.entities.StudySession.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const createPreferences = useMutation({
    mutationFn: (data) => studyplanApi.entities.UserPreferences.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
  });

  const updatePreferences = useMutation({
    mutationFn: ({ id, data }) => studyplanApi.entities.UserPreferences.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
  });

  const createReward = useMutation({
    mutationFn: (data) => studyplanApi.entities.Reward.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward'] })
  });

  const updateReward = useMutation({
    mutationFn: ({ id, data }) => studyplanApi.entities.Reward.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward'] })
  });

  const handleStatusChange = async (task, newStatus) => {
    const nowIso = new Date().toISOString();
    const data = {
      status: newStatus,
      completed_at: newStatus === 'termine' ? nowIso : null,
    };
    await updateTask.mutateAsync({ id: task.id, data });

    // Anti-glitch: points are granted once per task only.
    if (newStatus === 'termine' && task.status !== 'termine' && !task.reward_granted) {
      await updateRewardProgress(task);
      await updateTask.mutateAsync({ id: task.id, data: { reward_granted: true } });
    }
  };

  const updateRewardProgress = async (task) => {
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

      // If there was no activity for a day, keep streak instead of resetting.
      const newStreak = lastDate === yesterday
        ? reward.current_streak + 1
        : lastDate === today
          ? reward.current_streak
          : reward.current_streak;
      
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
    if (!isPremium && !editingTask && isFreePlanDailyQuotaReached(tasks, isPremium)) {
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
    if (!isPremium) {
      const cap = getFreeTaskSlotsToday(tasks, isPremium);
      if (importedTasks.length > 0 && cap <= 0) {
        setShowPremium(true);
        return;
      }
      if (importedTasks.length > cap) {
        bulkCreateTasks.mutate(importedTasks.slice(0, cap));
        setShowPremium(true);
        return;
      }
    }
    bulkCreateTasks.mutate(importedTasks);
  };

  const handleOnboardingComplete = (prefsData) => {
    let loc = 'fr'
    try {
      loc = localStorage.getItem('studyplan:locale') || 'fr'
    } catch { /* */ }
    createPreferences.mutate({ ...prefsData, locale: loc, onboarding_completed: true });
    setShowOnboarding(false);
  };

  const handleCancelSubscription = () => {
    if (!window.confirm(t('cancelSubConfirm'))) return
    void (async () => {
      try {
        await studyplanApi.billing.cancelActiveSubscription()
      } catch { /* */ }
      await queryClient.invalidateQueries({ queryKey: ['subscription'] })
    })()
  }

  const handleUpdatePrefs = async (prefsData) => {
    if (userPrefs?.id) {
      await updatePreferences.mutateAsync({ id: userPrefs.id, data: prefsData });
    }
  };

  const handleLogout = async () => {
    await studyplanApi.auth.logout();
    await queryClient.clear();
    navigate('/login', { replace: true });
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

  useEffect(() => {
    const now = Date.now();
    const staleCompletedTasks = completedTasks.filter((task) => {
      if (!task.completed_at) return false;
      const completedAt = new Date(task.completed_at).getTime();
      if (Number.isNaN(completedAt)) return false;
      return now - completedAt > 60 * 60 * 1000;
    });
    if (!staleCompletedTasks.length) return;
    void (async () => {
      for (const t of staleCompletedTasks) {
        try {
          await studyplanApi.entities.Task.delete(t.id);
        } catch { /* */ }
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    })();
  }, [completedTasks, queryClient]);

  if (userLoading) {
    return (
      <div className="min-h-dvh min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full">
          <div className="p-6 space-y-2 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Chargement…</h1>
            <p className="text-sm text-slate-600">On prépare ton tableau de bord StudPlan.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-dvh min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full">
          <div className="p-6 space-y-4 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Connecte-toi pour accéder à StudPlan</h1>
            <p className="text-sm text-slate-600">
              Tes données sont stockées par utilisateur pour éviter tout mélange de devoirs.
            </p>
            <Link to="/login">
              <Button className="w-full">Se connecter</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 pb-[max(0.75rem,env(safe-area-inset-bottom))] touch-manipulation">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-slate-200/50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
                StudPlan
                {isPremium && (
                  <span className="inline-flex flex-col items-end gap-0.5">
                    <span
                      className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] sm:text-xs font-bold flex-shrink-0"
                      title={subscription?.is_founder ? t('founderBadgeTitle') : (isPaypal ? t('paypalSub') : undefined)}
                    >
                      {subscription?.is_founder ? t('founderBadgeLabel') : t('premiumBadge')}
                    </span>
                    {isPaypal && !subscription?.is_founder && (
                      <span className="text-[9px] font-medium text-amber-800/90 leading-none pr-0.5">
                        PayPal
                      </span>
                    )}
                  </span>
                )}
              </h1>
              <p className="text-[11px] sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
                {t('appSubtitle')}
              </p>
              {currentUser?.email ? (
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate max-w-[14rem] sm:max-w-[20rem]" title={currentUser.email}>
                  {currentUser.email}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="rounded-2xl h-11 w-11 border border-slate-200 bg-white/90 text-slate-700 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 p-0 shadow-sm hover:shadow-md transition-all"
                title={t('logout')}
                aria-label={t('logout')}
              >
                <Power className="text-slate-700" style={{ width: 22, height: 22 }} strokeWidth={2.6} />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConnectPronote(true)}
                className="rounded-2xl h-10 min-h-10 px-2 border-2 border-violet-300 text-violet-900 hover:bg-violet-50"
                title={t('schoolImportBtn')}
              >
                <div className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                </div>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-2xl h-11 w-11 sm:h-12 sm:w-12 border border-slate-200 bg-white/90 hover:bg-slate-50 hover:border-violet-200 p-0 shadow-sm hover:shadow-md transition-all"
                aria-label={t('settings')}
              >
                <SettingsIcon className="text-slate-700" style={{ width: 22, height: 22 }} strokeWidth={2.6} />
              </Button>
              <Button
                onClick={openAddTask}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-11 w-11 sm:h-12 sm:w-12 p-0"
              >
                <Plus className="text-white" style={{ width: 30, height: 30 }} strokeWidth={3} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-2 sm:pt-0">
        {!isPremium && <AdBanner onUpgrade={() => setShowPremium(true)} />}
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 gap-1 mb-4 sm:mb-6 min-h-[3.5rem] sm:min-h-[3.75rem] p-1.5 bg-slate-100/80 rounded-2xl">
            <TabsTrigger
              value="tasks"
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:text-base font-semibold min-h-[3.25rem] touch-manipulation transition-all text-slate-700",
                activeTab === 'tasks' && "!bg-slate-900 !text-white shadow-md",
              )}
            >
              <ListTodo className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('myTasks')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="planning"
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:text-base font-semibold min-h-[3.25rem] touch-manipulation transition-all text-slate-700",
                activeTab === 'planning' && "!bg-slate-900 !text-white shadow-md",
              )}
            >
              <Calendar className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('planning')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:text-base font-semibold min-h-[3.25rem] touch-manipulation transition-all text-slate-700",
                activeTab === 'completed' && "!bg-slate-900 !text-white shadow-md",
              )}
            >
              <CheckCircle2 className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('validated')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 sm:space-y-6 mt-0">
            {/* Premium CTA for free users */}
            {!isPremium && isFreePlanDailyQuotaReached(tasks, isPremium) && (
              <Card className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowPremium(true)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-amber-900 text-sm sm:text-base">{t('premiumCtaTitle')}</p>
                      <p className="text-xs sm:text-sm text-amber-700">
                        {t('premiumCtaBody')}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs sm:text-sm flex-shrink-0">
                    {t('seeOffer')}
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
                {t('generatePlanning')}
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
                  {t('noTasksYet')}
                </h2>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {t('emptyTasksSchoolHint')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                  <Button onClick={openAddTask} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addTask')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowConnectPronote(true)} className="rounded-xl">
                    <School className="w-4 h-4 mr-2" />
                    {t('schoolImportBtn')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      {t('todoSection')} ({pendingTasks.length})
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
          <TabsContent value="completed" className="mt-0 space-y-3">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              {t('validatedTasksSection')} ({completedTasks.length})
            </h3>
            <p className="text-xs text-slate-500">
              {t('validatedInfo')}
            </p>
            {completedTasks.length === 0 ? (
              <Card className="p-4 text-sm text-slate-600">{t('noValidatedTasks')}</Card>
            ) : (
              completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              ))
            )}
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
        onOpenChange={(open) => {
          setShowImport(open);
          if (!open) setSchoolPdfSource(null);
        }}
        onImport={handleImportTasks}
        userPrefs={userPrefs}
        initialTab={importTab}
        isPremium={isPremium}
        schoolPdfSource={schoolPdfSource}
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
        onOpenPdfImport={(source) => openImportTab('pdf', { schoolPdf: true, source })}
      />

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        userPrefs={userPrefs}
        onUpdatePrefs={handleUpdatePrefs}
        subscription={subscription}
        isPremium={isPremium}
        onCancelSubscription={handleCancelSubscription}
      />

      <PremiumModal
        open={showPremium}
        onOpenChange={setShowPremium}
        onPaypalReturn={() => {
          // En production, le premium ne doit être activé qu'après validation serveur du paiement.
          setShowPremium(false)
        }}
        onTestPremium={() => {
          void (async () => {
            try { await studyplanApi.billing.activatePaypalPremium({ orderId: 'dev_test' }) } catch { /* */ }
            await queryClient.invalidateQueries({ queryKey: ['subscription'] })
            setShowPremium(false)
          })()
        }}
      />

      <InstallPrompt />

      <Dialog open={showFounderWelcome} onOpenChange={setShowFounderWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('founderWelcomeTitle')}</DialogTitle>
            <DialogDescription>
              {t('founderWelcomeBody')}
            </DialogDescription>
          </DialogHeader>
          <Button type="button" onClick={() => setShowFounderWelcome(false)} className="w-full">
            {t('founderWelcomeOk')}
          </Button>
        </DialogContent>
      </Dialog>

      <MoveSessionModal
        open={!!movingSession}
        onOpenChange={(open) => !open && setMovingSession(null)}
        session={movingSession}
        onMove={handleMoveSession}
      />

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-3 sm:px-4 py-6 mt-8 border-t border-slate-200">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} StudPlan - {t('rightsReserved')}
          <br />
          {t('createdBy')} <span className="font-semibold text-slate-700">Hugo Di Chiara</span>
          <br />
          <Link to="/privacy" className="text-violet-700 hover:underline">
            {t('dataPolicy')}
          </Link>
        </p>
        <div className="text-center mt-2">
          <a
            href={import.meta.env.VITE_VINTGEN_URL || 'https://vintgen.pages.dev'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-700 hover:underline"
          >
            {t('discoverApps')}
          </a>
        </div>
      </footer>

      <Dialog open={showAddChooser} onOpenChange={setShowAddChooser}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('addTask')}</DialogTitle>
            <DialogDescription>
              {t('addTaskChooserSubtitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Button type="button" onClick={openManualAdd} className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              {t('addManual')}
            </Button>
            <Button type="button" variant="outline" onClick={() => openImportTab('photo')} className="w-full justify-start">
              <Camera className="w-4 h-4 mr-2" />
              {t('importByPhoto')}
            </Button>
            <Button type="button" variant="outline" onClick={() => openImportTab('text')} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              {t('importByText')}
            </Button>
            <Button type="button" variant="outline" onClick={() => openImportTab('pdf')} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              {t('importPdfPronote')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
