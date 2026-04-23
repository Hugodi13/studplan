/**
 * Plafond gratuit : 1 nouveau devoir par jour (calendrier local).
 * Les comptes premium / fondateurs n'ont pas de limite.
 */
export function getLocalDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Tâches dont `created_date` est ce jour (préfixe YYYY-MM-DD).
 */
export function countTasksCreatedOnDate(tasks, dateKey) {
  if (!Array.isArray(tasks) || !dateKey) return 0
  return tasks.filter((t) => {
    const cd = t?.created_date
    if (!cd) return false
    const part = String(cd).slice(0, 10)
    return part === dateKey
  }).length
}

/** Nombre de devoirs qu'on peut encore ajouter aujourd'hui (0 ou 1 en gratuit). */
export function getFreeTaskSlotsToday(tasks, isPremium) {
  if (isPremium) return 9999
  const n = countTasksCreatedOnDate(tasks, getLocalDateKey())
  return Math.max(0, 1 - n)
}

export function isFreePlanDailyQuotaReached(tasks, isPremium) {
  return getFreeTaskSlotsToday(tasks, isPremium) <= 0
}

const MS_14_DAYS = 14 * 24 * 60 * 60 * 1000
const SCHOOL_PDF_LAST_KEY = 'studyplan:lastSchoolPdfImportAt'

/** Import PDF depuis le flux Pronote / École Directe : 1 fois / 14 jours en gratuit. */
export function getSchoolPdfImportCooldownForFree() {
  try {
    const raw = localStorage.getItem(SCHOOL_PDF_LAST_KEY)
    if (!raw) return { ok: true, daysRemaining: 0 }
    const t = parseInt(raw, 10)
    if (Number.isNaN(t)) return { ok: true, daysRemaining: 0 }
    const elapsed = Date.now() - t
    if (elapsed >= MS_14_DAYS) return { ok: true, daysRemaining: 0 }
    const daysRemaining = Math.max(1, Math.ceil((MS_14_DAYS - elapsed) / (24 * 60 * 60 * 1000)))
    return { ok: false, daysRemaining }
  } catch {
    return { ok: true, daysRemaining: 0 }
  }
}

export function markSchoolPdfImportedNow() {
  try {
    localStorage.setItem(SCHOOL_PDF_LAST_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}
