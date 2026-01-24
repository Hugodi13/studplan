{
  "name": "UserPreferences",
  "type": "object",
  "properties": {
    "class_level": {
      "type": "string",
      "enum": [
        "sixieme",
        "cinquieme",
        "quatrieme",
        "troisieme",
        "seconde",
        "premiere",
        "terminale",
        "prepa",
        "universite",
        "professionnel"
      ],
      "description": "Niveau de classe"
    },
    "specialties": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Sp\u00e9cialit\u00e9s choisies (pour lyc\u00e9e)"
    },
    "daily_study_minutes": {
      "type": "number",
      "default": 120,
      "description": "Minutes de r\u00e9vision par jour"
    },
    "study_start_hour": {
      "type": "number",
      "default": 17,
      "description": "Heure de d\u00e9but des r\u00e9visions"
    },
    "study_end_hour": {
      "type": "number",
      "default": 21,
      "description": "Heure de fin des r\u00e9visions"
    },
    "break_duration_minutes": {
      "type": "number",
      "default": 10,
      "description": "Dur\u00e9e des pauses"
    },
    "include_sunday": {
      "type": "boolean",
      "default": false,
      "description": "Inclure le dimanche comme jour de travail"
    },
    "pronote_username": {
      "type": "string",
      "description": "Identifiant Pronote"
    },
    "pronote_password": {
      "type": "string",
      "description": "Mot de passe Pronote (crypt\u00e9)"
    },
    "pronote_url": {
      "type": "string",
      "description": "URL de l'\u00e9tablissement Pronote"
    },
    "ecoledirecte_username": {
      "type": "string",
      "description": "Identifiant \u00c9cole Directe"
    },
    "ecoledirecte_password": {
      "type": "string",
      "description": "Mot de passe \u00c9cole Directe (crypt\u00e9)"
    },
    "auto_sync_enabled": {
      "type": "boolean",
      "default": false,
      "description": "Synchronisation automatique activ\u00e9e"
    },
    "onboarding_completed": {
      "type": "boolean",
      "default": false,
      "description": "Configuration initiale termin\u00e9e"
    }
  },
  "required": []
}