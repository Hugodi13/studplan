import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Trash2, AlertTriangle, Mail, Shield, Clock, GraduationCap, Crown, Languages, FileArchive } from "lucide-react";
import { studyplanApi } from "@/api/studyplanClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useI18n } from "@/lib/I18nContext";
const PAYPAL_SUBSCRIBE_DEFAULT =
  'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-1YC555706H685240MNHUNJFQ'
const PAYPAL_HREF = import.meta.env.VITE_PAYPAL_SUBSCRIBE_URL || PAYPAL_SUBSCRIBE_DEFAULT

const CLASS_LEVELS = [
  { value: 'sixieme', label: '6ème', group: 'Collège' },
  { value: 'cinquieme', label: '5ème', group: 'Collège' },
  { value: 'quatrieme', label: '4ème', group: 'Collège' },
  { value: 'troisieme', label: '3ème', group: 'Collège' },
  { value: 'seconde', label: '2nde', group: 'Lycée' },
  { value: 'premiere', label: '1ère', group: 'Lycée' },
  { value: 'terminale', label: 'Terminale', group: 'Lycée' },
  { value: 'prepa_mpsi', label: 'Prépa MPSI', group: 'Prépa' },
  { value: 'prepa_pcsi', label: 'Prépa PCSI', group: 'Prépa' },
  { value: 'prepa_ptsi', label: 'Prépa PTSI', group: 'Prépa' },
  { value: 'prepa_bcpst', label: 'Prépa BCPST', group: 'Prépa' },
  { value: 'prepa_ecg', label: 'Prépa ECG', group: 'Prépa' },
  { value: 'prepa_ect', label: 'Prépa ECT', group: 'Prépa' },
  { value: 'prepa_hypokhagne', label: 'Prépa Hypokhâgne', group: 'Prépa' },
  { value: 'prepa_khagne', label: 'Prépa Khâgne', group: 'Prépa' },
  { value: 'universite', label: 'Université', group: 'Supérieur' },
  { value: 'professionnel', label: 'Professionnel', group: 'Autre' }
];

const LYC_SPE = [
  "Maths", "Physique-Chimie", "SVT", "NSI", "SES", "SI",
  "HGGSP", "HLP", "LLCER Anglais", "LLCER Espagnol", "Arts"
];

export default function SettingsModal({ open, onOpenChange, userPrefs, onUpdatePrefs, subscription = null, isPremium = false, onCancelSubscription }) {
  const { t, locale, setLocale, languages } = useI18n();
  const isEn = locale === 'en';
  const tx = {
    settings: isEn ? 'Settings' : 'Paramètres',
    premium: 'Premium',
    paymentPaypal: isEn ? 'Payment via PayPal' : 'Paiement via PayPal',
    activeSub: isEn ? 'Active subscription' : 'Abonnement actif',
    cancelEndMonth: isEn ? 'Cancel (end of month)' : 'Résilier (fin de mois)',
    subscription: isEn ? 'Subscription' : 'Abonnement',
    premiumPitch: isEn
      ? 'Upgrade to Premium at €5/month: no ads, unlimited tasks, and unlimited Pronote / École Directe PDF imports.'
      : 'Passe en Premium à 5€/mois : sans pub, tâches illimitées, imports PDF Pronote / École Directe illimités.',
    subscribePaypal: isEn ? 'Subscribe with PayPal' : 'S’abonner avec PayPal',
    missingPaypal: isEn ? 'Missing PayPal link.' : 'Lien PayPal manquant.',
    accountStatus: isEn ? 'Account status' : 'Statut du compte',
    founderInfoBtn: isEn ? 'Founder (click for details)' : 'Fondateur (clique pour plus d’infos)',
    schoolPdfTitle: isEn ? 'Pronote / Ecole Directe (PDF)' : 'Pronote / École Directe (PDF)',
    schoolPdfDesc: isEn
      ? 'Free: 1 school PDF import every 14 days (from the school button). Premium: unlimited PDF imports. No automatic server sync — you export the homework PDF yourself.'
      : 'Gratuit : 1 import PDF « école » toutes les 2 semaines (bouton Pronote / École Directe). Premium : imports PDF illimités. Pas de synchro serveur automatique : tu exportes le PDF du cahier toi-même.',
    schoolLevel: isEn ? 'School level' : 'Niveau scolaire',
    pickLevel: isEn ? 'Select your level' : 'Sélectionne ton niveau',
    specialties: isEn ? 'Specialties (editable anytime)' : 'Spécialités (modifiables à tout moment)',
    firstLabel: (m) => (isEn ? `Premiere: choose up to ${m} specialties` : `Première: choisis jusqu'à ${m} spécialités`),
    finalLabel: (m) => (isEn ? `Terminale: choose up to ${m} specialties` : `Terminale: choisis jusqu'à ${m} spécialités`),
    selectedCount: (s, m) => (isEn ? `${s}/${m} selected` : `${s}/${m} sélectionnées`),
    studyTime: isEn ? 'Study time' : 'Temps de révision',
    dailyTime: isEn ? 'Daily time' : 'Temps quotidien',
    startTime: isEn ? 'Start time' : 'Heure de début',
    sunday: isEn ? 'Study on Sunday' : 'Travailler le dimanche',
    savePrefs: isEn ? 'Save preferences' : 'Enregistrer les préférences',
    dataPolicy: isEn ? 'Data protection policy' : 'Charte de protection des données',
    contactUs: isEn ? 'Contact us' : 'Nous contacter',
    deleteAccount: isEn ? 'Delete my account' : 'Supprimer mon compte',
    sure: isEn ? 'Are you sure?' : 'Es-tu sûr ?',
    deleteWarn: isEn ? 'All your data (tasks, planning, preferences) will be permanently deleted within 30 days.' : 'Toutes tes données (tâches, planning, préférences) seront définitivement supprimées dans 30 jours.',
    cancel: isEn ? 'Cancel' : 'Annuler',
    confirm: isEn ? 'Confirm' : 'Confirmer',
    deleting: isEn ? 'Deleting...' : 'Suppression...',
    founderTitle: isEn ? 'Founder account' : 'Compte Fondateur',
    founderDesc: isEn ? 'Congrats, you are one of the first 100 users. This gives you lifetime Premium.' : 'Bravo, tu fais partie des 100 premiers utilisateurs de l’app. Ce statut te donne Premium à vie, sans abonnement mensuel.',
    great: isEn ? 'Great' : 'Super',
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState(userPrefs?.daily_study_minutes || 120);
  const [startHour, setStartHour] = useState(userPrefs?.study_start_hour || 17);
  const [includeSunday, setIncludeSunday] = useState(userPrefs?.include_sunday || false);
  const [classLevel, setClassLevel] = useState(userPrefs?.class_level || 'troisieme');
  const [selectedSpecialties, setSelectedSpecialties] = useState(userPrefs?.specialties || []);
  const [appLocale, setAppLocale] = useState(userPrefs?.locale || locale || 'fr');
  const [showFounderInfo, setShowFounderInfo] = useState(false);

  useEffect(() => {
    if (!open || !userPrefs) return
    const normalizedLevel = userPrefs.class_level === 'prepa' ? 'prepa_mpsi' : (userPrefs.class_level || 'troisieme')
    setDailyMinutes(userPrefs.daily_study_minutes ?? 120)
    setStartHour(userPrefs.study_start_hour ?? 17)
    setIncludeSunday(userPrefs.include_sunday || false)
    setClassLevel(normalizedLevel)
    setSelectedSpecialties(Array.isArray(userPrefs.specialties) ? userPrefs.specialties : [])
    const L = userPrefs.locale || 'fr'
    setAppLocale(L)
    setLocale(L)
  }, [open, userPrefs, setLocale])

  const isLyceeSpe = classLevel === 'premiere' || classLevel === 'terminale'
  const availableSpecialties = isLyceeSpe ? LYC_SPE : []
  const maxSpecialties = classLevel === 'premiere' ? 3 : 2

  useEffect(() => {
    if (!availableSpecialties.length) {
      setSelectedSpecialties([])
      return
    }
    setSelectedSpecialties((prev) =>
      prev.filter((s) => availableSpecialties.includes(s)).slice(0, maxSpecialties),
    )
  }, [classLevel, maxSpecialties]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSpecialty = (specialty) => {
    setSelectedSpecialties((prev) => {
      if (prev.includes(specialty)) return prev.filter((s) => s !== specialty)
      if (prev.length >= maxSpecialties) return prev
      return [...prev, specialty]
    })
  }

  const handleSavePreferences = async () => {
    if (userPrefs?.id) {
      try {
        localStorage.setItem('studyplan:locale', appLocale)
      } catch { /* */ }
      setLocale(appLocale)
      await onUpdatePrefs({
        daily_study_minutes: dailyMinutes,
        study_start_hour: startHour,
        include_sunday: includeSunday,
        class_level: classLevel,
        specialties: availableSpecialties.length ? selectedSpecialties : [],
        auto_sync_on_launch: false,
        locale: appLocale,
      });
      onOpenChange(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // L'utilisateur sera déconnecté et redirigé
      await studyplanApi.auth.logout();
      alert("Ton compte sera supprimé dans les 30 jours. Contacte-nous si tu changes d'avis.");
    } catch (error) {
      alert("Erreur lors de la suppression du compte");
    }
    setIsDeleting(false);
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700">
              <Settings className="w-4 h-4 text-white" />
            </div>
            {tx.settings}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Languages className="w-4 h-4" />
              {t('language')}
            </h3>
            <div className="inline-flex items-center rounded-full bg-white p-1 shadow-sm border border-slate-200">
              {Object.entries(languages).map(([code, label]) => {
                const active = appLocale === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setAppLocale(code)}
                    className={
                      'px-3 py-1.5 text-xs font-semibold rounded-full transition-all ' +
                      (active
                        ? 'bg-emerald-700 text-white shadow'
                        : 'text-slate-600 hover:text-slate-900')
                    }
                    aria-pressed={active}
                  >
                    {label === 'Français' ? 'FR' : 'EN'}
                  </button>
                )
              })}
            </div>
          </div>

          {isPremium && !subscription?.is_founder && typeof onCancelSubscription === 'function' ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                {tx.premium}
              </h3>
              <p className="text-xs text-amber-800">
                {subscription?.payment_provider === 'paypal' ? tx.paymentPaypal : tx.activeSub}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => onCancelSubscription?.()}
              >
                {tx.cancelEndMonth}
              </Button>
            </div>
          ) : null}

          {!isPremium ? (
            <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
              <h3 className="text-sm font-semibold text-violet-900 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                {tx.subscription}
              </h3>
              <p className="text-xs text-violet-800">{tx.premiumPitch}</p>
              {PAYPAL_HREF ? (
                <Button type="button" asChild className="w-full bg-[#0070ba] hover:bg-[#005ea6]">
                  <a href={PAYPAL_HREF} target="_blank" rel="noopener noreferrer">
                    {tx.subscribePaypal}
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-rose-700">{tx.missingPaypal}</p>
              )}
            </div>
          ) : null}

          {subscription?.is_founder ? (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <h3 className="text-sm font-semibold text-emerald-900">{tx.accountStatus}</h3>
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                onClick={() => setShowFounderInfo(true)}
              >
                {tx.founderInfoBtn}
              </Button>
            </div>
          ) : null}

          <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-violet-600" />
              {tx.schoolPdfTitle}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{tx.schoolPdfDesc}</p>
          </div>

          {/* Class level */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {tx.schoolLevel}
            </h3>
            <Select value={classLevel} onValueChange={setClassLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tx.pickLevel} />
              </SelectTrigger>
              <SelectContent>
                {['Collège', 'Lycée', 'Prépa', 'Supérieur', 'Autre'].map((group) => {
                  const rows = CLASS_LEVELS.filter((x) => x.group === group)
                  if (!rows.length) return null
                  return (
                    <div key={group}>
                      <div className="px-2 py-1 text-xs font-semibold text-slate-500">{group}</div>
                      {rows.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </div>
                  )
                })}
              </SelectContent>
            </Select>
            {isLyceeSpe ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">
                  {tx.specialties}
                </p>
                <p className="text-[11px] text-slate-500">
                  {classLevel === 'premiere'
                    ? tx.firstLabel(maxSpecialties)
                    : tx.finalLabel(maxSpecialties)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSpecialties.map((spe) => {
                    const active = selectedSpecialties.includes(spe)
                    const disabled = !active && selectedSpecialties.length >= maxSpecialties
                    return (
                      <Button
                        key={spe}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSpecialty(spe)}
                        disabled={disabled}
                        className={active ? "bg-violet-600 hover:bg-violet-700" : ""}
                      >
                        {spe}
                      </Button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  {tx.selectedCount(selectedSpecialties.length, maxSpecialties)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Study preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {tx.studyTime}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">{tx.dailyTime}</Label>
                <span className="text-sm font-semibold text-violet-600">{formatTime(dailyMinutes)}</span>
              </div>
              <Slider
                value={[dailyMinutes]}
                onValueChange={([value]) => setDailyMinutes(value)}
                min={30}
                max={540}
                step={15}
              />
            <p className="text-xs text-slate-500">Jusqu’à 9 h (540 min) par jour.</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">{tx.startTime}</Label>
                <span className="text-sm font-semibold text-violet-600">{startHour}h00</span>
              </div>
              <Slider
                value={[startHour]}
                onValueChange={([value]) => setStartHour(value)}
                min={6}
                max={22}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <Label className="text-sm">{tx.sunday}</Label>
              <Button
                variant={includeSunday ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeSunday(!includeSunday)}
                className={includeSunday ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              >
                {includeSunday ? tx.enabled : tx.disabled}
              </Button>
            </div>

            <Button
              onClick={handleSavePreferences}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {tx.savePrefs}
            </Button>
          </div>

          {/* Links */}
          <div className="space-y-2 pt-4 border-t">
            <Link to={createPageUrl('Privacy')}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Shield className="w-4 h-4" />
                {tx.dataPolicy}
              </Button>
            </Link>
            
            <a href="mailto:hugodi777@outlook.fr">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Mail className="w-4 h-4" />
                {tx.contactUs}
              </Button>
            </a>
          </div>

          {/* Delete account */}
          <div className="pt-4 border-t">
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                {tx.deleteAccount}
              </Button>
            ) : (
              <Alert className="bg-rose-50 border-rose-200">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <AlertDescription className="text-rose-800 text-sm">
                  <p className="font-semibold mb-2">{tx.sure}</p>
                  <p className="mb-3 text-xs">
                    {tx.deleteWarn}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      {tx.cancel}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? tx.deleting : tx.confirm}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
      <Dialog open={showFounderInfo} onOpenChange={setShowFounderInfo}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tx.founderTitle}</DialogTitle>
            <DialogDescription>
              {tx.founderDesc}
            </DialogDescription>
          </DialogHeader>
          <Button type="button" onClick={() => setShowFounderInfo(false)} className="w-full">
            {tx.great}
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}