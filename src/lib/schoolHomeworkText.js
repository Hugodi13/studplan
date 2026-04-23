import { getSubjectsForLevel, calculateEstimatedMinutes } from '@/components/utils/subjects'

const URLISH =
  /https?:\/\/|www\.|\.html\b|\.php\b|\/eleve\/?|pronote|index-education|indexeducation|i[-.]education|généré|genere|parametr|déconnexion|deconnexion|imprimer|questionnaire.*satisf|\.lycee-|\.ac-[a-z]{2,3}\.|cndp\.|eduscol\.|education\.gouv/i

const NAV_FOOTER =
  /cahier\s+de\s+textes?|carnet|note\s*:|moyenne|moy\.\s*\d|bulletin|absence|retard|v\d+\.\d+|version\s*[\d.]+/i

const DATE_LINE_HINT =
  /(pour|avant|a\s*rendre|a\s*rendu|a\s*faire|rendu|rendre|limite|date|semaine|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i

const HOMEWORK_CUE =
  /(exercice|exercices|ex\.|ex\s|ex\d|n°\s*\d|p\.\s*\d|page|pages|chapitre|chap\.|fiche|devoir|travail|dm\b|dm,|rédiger|rediger|lire|apprendre|contr[ôo]le|évaluation|evaluation|interro|oral|compléter|retenir|étudier|copier|faire|séance|séance|question|réponse|fait|non\s+fait|dm\s*:|cours|par\s*c[œo]ur)/i

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Ligne d'en-tête / nav / bas de page Pronote, ou URL — à exclure des tâches.
 */
export function isSchoolPdfJunkLine(line) {
  const t = String(line || '').trim()
  if (t.length < 4) return true
  if (/\/[a-z_\-]*\.html?\b/i.test(t) || /\/pronote\//i.test(t) || /\/eleve\.html/i.test(t)) {
    return true
  }
  const n = normalize(t)
  if (URLISH.test(t) || URLISH.test(n)) return true
  if (t.length < 55 && (NAV_FOOTER.test(t) || /^(fiche|classe|trimestre|année)\s*:/i.test(t))) {
    return true
  }
  if (/^page\s+\d+(\s*\/\s*\d+)?$/i.test(t)) return false
  if (/^[\d.,:\s%\-–—]+$/.test(t)) return true
  if (/^(\d{1,2}h\d{2}|\d{1,2}:\d{2})$/.test(t.trim())) return true
  return false
}

function toIsoFromFrenchDate(raw) {
  const txt = normalize(raw)
  const s = raw.replace(/\s+/g, ' ').trim()
  const m1er = s.match(
    /^(?:(\d{1,2})|1er)\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?$/i,
  )
  if (m1er) {
    const monthMap = {
      janvier: 1,
      fevrier: 2,
      mars: 3,
      avril: 4,
      mai: 5,
      juin: 6,
      juillet: 7,
      aout: 8,
      septembre: 9,
      octobre: 10,
      novembre: 11,
      decembre: 12,
    }
    const d = m1er[1] ? parseInt(m1er[1], 10) : 1
    const monKey = normalize(m1er[2])
    const mo = monthMap[monKey]
    const y = m1er[3] ? parseInt(m1er[3], 10) : new Date().getFullYear()
    if (d >= 1 && d <= 31 && mo) {
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }
  const direct = txt.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/)
  if (direct) {
    const a = parseInt(direct[1], 10)
    const b = parseInt(direct[2], 10)
    const y = direct[3] ? parseInt(direct[3], 10) : new Date().getFullYear()
    const yyyy = y < 100 ? 2000 + y : y
    let day = a
    let month = b
    if (a > 12 && b <= 12) {
      day = a
      month = b
    } else if (a <= 12 && b <= 12) {
      day = a
      month = b
    } else {
      return null
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${yyyy}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return null
}

function toIsoFromFrenchLongDate(raw) {
  const txt = normalize(raw)
  const monthMap = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12,
  }
  const re = /(\d{1,2}|1er)\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s*(\d{4})?/i
  const m = txt.match(re)
  if (!m) return null
  const d = m[1] === '1er' ? 1 : parseInt(m[1], 10)
  const mon = m[2].toLowerCase()
  const mo = monthMap[mon]
  const y = m[3] ? parseInt(m[3], 10) : new Date().getFullYear()
  if (!mo || d < 1 || d > 31) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseDateFromLine(line) {
  return toIsoFromFrenchDate(line) || toIsoFromFrenchLongDate(line)
}

const SUBJ_ABBREV = {
  maths: 'Mathématiques',
  mathematiques: 'Mathématiques',
  'math.': 'Mathématiques',
  math: 'Mathématiques',
  hg: 'Histoire-Géographie',
  hggsp: 'Histoire-Géographie',
  svt: 'SVT',
  pc: 'Physique-Chimie',
  'phys-chim': 'Physique-Chimie',
  esp: 'Espagnol',
  all: 'Allemand',
  llc: 'Anglais',
  llcer: 'Anglais',
  snt: 'SNT',
  'ses ': 'SES',
  ses: 'SES',
  philo: 'Philosophie',
  'fr.': 'Français',
  'fr. ': 'Français',
  eps: 'EPS',
}

function detectSubjectFromLine(line, subjectList) {
  const nLine = normalize(line)
  for (const s of subjectList) {
    const ns = normalize(s)
    if (nLine.includes(ns) || nLine === ns) return s
  }
  if (nLine.includes('mathemat') || nLine === 'maths' || nLine === 'math') {
    return 'Mathématiques'
  }
  if (nLine.includes('franc') || nLine === 'fr') return 'Français'
  if (nLine.includes('hist') || nLine.includes('geo') || nLine === 'hggsp') {
    return 'Histoire-Géographie'
  }
  if (nLine.includes('phy') && nLine.includes('chim')) return 'Physique-Chimie'
  if (nLine.match(/\bsvt\b/)) return 'SVT'
  if (nLine.match(/\bphi/) || nLine === 'philo') return 'Philosophie'
  if (nLine.match(/\bespagnol|\besp\b/)) return 'Espagnol'
  if (nLine.match(/\ballemand|\ball\b/)) return 'Allemand'
  if (nLine.match(/\banglais|\bang\b/)) return 'Anglais'
  return null
}

/**
 * Ligne seule = nom de matière (Pronote : titre de colonne / bloc) → nom canonique
 */
function looksLikeSubjectHeader(line, subjectList) {
  const t = String(line || '').trim()
  if (t.length < 2 || t.length > 58) return null
  if (t.includes('http') || t.includes('www') || t.includes('html') || t.includes('://')) return null
  if (t.length > 32 && /devoir|exercice|page|chap\.|fiche|lire|dm\b|n°|p\.\d/i.test(t)) {
    return null
  }
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    const w = normalize(words[0].replace(/[.:]$/, ''))
    if (SUBJ_ABBREV[w]) return SUBJ_ABBREV[w]
  }
  const hit = detectSubjectFromLine(t, subjectList)
  if (!hit) return null
  if (t.length > 40 && [':', '—', '–', '-', '·'].some((c) => t.includes(c) && t.indexOf(c) < 25)) {
    return null
  }
  if (t.length > 30 && /devoir|exercice|fiche|page\s*\d|p\.\d/i.test(t)) return null
  return hit
}

function isStrictHomeworkLine(nLine) {
  return /[:\-–—•·▪]/.test(nLine) || HOMEWORK_CUE.test(nLine)
}

function isRelaxedHomeworkLine(line, nLine) {
  const cue = HOMEWORK_CUE
  const hasDigit = /\d/.test(line)
  if (cue.test(line)) return true
  if (line.length >= 20 && hasDigit) return true
  return false
}

function detectDifficulty(nLine) {
  if (
    /controle|contrôle|dissertation|devoir maison|expose|partiel|bac blanc|evaluation|évaluation|brevet|bac\b/.test(
      nLine,
    )
  ) {
    return 'difficile'
  }
  if (/\bdm\b|synthèse|synthese|dossier|recherche/.test(nLine)) {
    return 'difficile'
  }
  if (/\brevision|révision|fiche|chapitre|exercice|ex\.|lire|apprendre|questionnaire/.test(nLine)) {
    return 'moyen'
  }
  return 'facile'
}

function countRefs(line) {
  const pageRefs = (line.match(/\bp\.?\s*(\d{1,3})\b|page\s*(\d{1,3})/gi) || []).length
  const exRefs = (line.match(/\bex\.?\s*\d|\bex\s*\d|n[°o]\s*\d/gi) || []).length
  return { pageRefs, exRefs }
}

function estimateMinutesForTask(difficulty, classLevel, line) {
  let base = calculateEstimatedMinutes(difficulty, classLevel)
  const { pageRefs, exRefs } = countRefs(line)
  const longLine = String(line).length
  const extra = Math.min(50, exRefs * 8 + pageRefs * 10)
  let more = extra
  if (longLine > 200) more += 15
  if (/\b(dm|dossier|synth|dissert|rédiger|rediger)\b/i.test(line)) {
    more += 25
  }
  const total = Math.max(20, Math.min(180, base + more))
  return total
}

function preCleanExtractedText(raw) {
  return String(raw || '')
    .split(/\n/)
    .map((l) =>
      l
        .replace(/\r/g, '')
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\bwww\.\S+/gi, '')
        .trim(),
    )
    .filter((l) => l.length > 0)
    .join('\n')
}

/**
 * @param {string} rawText
 * @param {{ classLevel: string, specialties: string[], mode: 'strict'|'relaxed' }} options
 * @returns {Array<{ title, subject, description, difficulty, estimated_minutes, due_date }>}
 */
export function parseHomeworkFromSchoolText(rawText, options) {
  const { classLevel = 'troisieme', specialties = [], mode = 'relaxed' } = options || {}
  const subjectList = getSubjectsForLevel(classLevel, specialties)
  const lines = preCleanExtractedText(rawText)
    .split(/\n/)
    .map((l) => l.replace(/\r/g, '').trim())
    .filter((l) => l.length > 0)

  const tasks = []
  let currentDate = null
  let currentSubject = null

  for (const line of lines) {
    if (isSchoolPdfJunkLine(line)) {
      currentSubject = null
      continue
    }
    const nLine = normalize(line)
    const subjectHeader = looksLikeSubjectHeader(line, subjectList)
    if (subjectHeader) {
      currentSubject = subjectHeader
      continue
    }
    if (line.length < 3) continue
    if (nLine.length < 40 && (DATE_LINE_HINT.test(line) || /^\d{1,2}\s*[/.\-]\s*\d{1,2}/.test(line))) {
      const d = parseDateFromLine(line)
      if (d) {
        currentDate = d
        continue
      }
    }
    if (nLine.length < 90 && (DATE_LINE_HINT.test(line) || nLine.match(/\b(14|20)\d{2}\b/))) {
      const d2 = parseDateFromLine(line)
      if (d2 && nLine.length < 55) {
        const hasHomeworkWording = /devoir|exercice|page|fiche|lire|dm|tra|ex\.|n°|p\.\d|chap/.test(
          nLine,
        )
        if (!hasHomeworkWording || nLine.length < 24) {
          currentDate = d2
          if (!HOMEWORK_CUE.test(nLine)) {
            continue
          }
        }
      }
    }
    const isHomework =
      mode === 'strict'
        ? isStrictHomeworkLine(nLine)
        : isRelaxedHomeworkLine(line, nLine) || (currentSubject && (/\d/.test(line) || line.length > 25))
    if (!isHomework) {
      if (parseDateFromLine(line) && nLine.length < 40) {
        const onlyDate = !HOMEWORK_CUE.test(nLine)
        if (onlyDate) {
          const d3 = parseDateFromLine(line)
          if (d3) {
            currentDate = d3
            continue
          }
        }
      }
      continue
    }
    const subj = currentSubject || detectSubjectFromLine(line, subjectList) || 'Autre'
    const finalSubject = subj || 'Autre'
    const dif = detectDifficulty(nLine)
    const due = currentDate || parseDateFromLine(line) || null
    const est = estimateMinutesForTask(dif, classLevel, line)
    const title = line
      .replace(/^[-•▪·\d.\)\s]+/u, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*https?:\/\/\S+.*$/i, '')
      .trim()
      .slice(0, 120) || (mode === 'relaxed' ? 'Devoir importé' : 'Tâche importée')

    if (isSchoolPdfJunkLine(title) || /^https?:\/\//i.test(title)) continue

    const cleanDesc = line
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/\bwww\.[^\s]+/gi, '')
      .trim()
      .slice(0, 2000)
    if (cleanDesc.length < 8) continue
    tasks.push({
      title,
      subject: finalSubject,
      description: cleanDesc,
      difficulty: dif,
      estimated_minutes: est,
      due_date: due,
    })
  }
  const seen = new Set()
  return tasks.filter((x) => {
    const k = `${normalize(x.subject)}|${normalize(x.title)}|${x.due_date || ''}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
