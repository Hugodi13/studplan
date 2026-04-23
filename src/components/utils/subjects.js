export const getSubjectsForLevel = (classLevel, specialties = []) => {
  const baseSubjects = {
    college: [
      "Mathématiques", "Français", "Histoire-Géographie", "Physique-Chimie",
      "SVT", "Anglais", "Espagnol", "Allemand", "Arts", "Technologie", "EPS", "Autre"
    ],
    seconde: [
      "Mathématiques", "Français", "Histoire-Géographie", "Physique-Chimie",
      "SVT", "SES", "Anglais", "Espagnol", "Allemand", "SNT", "EPS", "Autre"
    ],
    lycee_spe: [
      "Philosophie", "Français", "Histoire-Géographie", "Anglais", "EPS",
      ...specialties,
      "Autre"
    ],
    prepa: [
      "Prépa", "Autre"
    ],
    universite: [
      "Autre"
    ],
    professionnel: [
      "Projet", "Réunion", "Formation", "Présentation", "Rapport", "Audit", "Autre"
    ]
  };

  if (['sixieme', 'cinquieme', 'quatrieme', 'troisieme'].includes(classLevel)) {
    return baseSubjects.college;
  }
  if (classLevel === 'seconde') {
    return baseSubjects.seconde;
  }
  if (['premiere', 'terminale'].includes(classLevel)) {
    return baseSubjects.lycee_spe;
  }
  if (classLevel === 'prepa' || String(classLevel || '').startsWith('prepa_')) {
    return baseSubjects.prepa;
  }
  if (classLevel === 'universite') {
    return [...baseSubjects.college, ...baseSubjects.prepa];
  }
  if (classLevel === 'professionnel') {
    return baseSubjects.professionnel;
  }
  
  return baseSubjects.college;
};

export const adjustDifficultyForLevel = (baseDifficulty, classLevel) => {
  const levelMultipliers = {
    sixieme: 0.7,
    cinquieme: 0.8,
    quatrieme: 0.9,
    troisieme: 1.0,
    seconde: 1.1,
    premiere: 1.3,
    terminale: 1.5,
    prepa: 2.0,
    prepa_mpsi: 2.0,
    prepa_pcsi: 2.0,
    prepa_ptsi: 2.0,
    prepa_bcpst: 2.0,
    prepa_ecg: 1.9,
    prepa_ect: 1.8,
    prepa_hypokhagne: 1.7,
    prepa_khagne: 1.8,
    universite: 1.8,
    professionnel: 1.5
  };
  
  return levelMultipliers[classLevel] || 1.0;
};

export const calculateEstimatedMinutes = (difficulty, classLevel) => {
  const baseMinutes = {
    facile: 30,
    moyen: 60,
    difficile: 90
  };
  
  const multiplier = adjustDifficultyForLevel(difficulty, classLevel);
  return Math.round(baseMinutes[difficulty] * multiplier);
};