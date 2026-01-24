{
  "name": "Task",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Titre de la t\u00e2che"
    },
    "subject": {
      "type": "string",
      "description": "Mati\u00e8re concern\u00e9e"
    },
    "description": {
      "type": "string",
      "description": "Description d\u00e9taill\u00e9e"
    },
    "difficulty": {
      "type": "string",
      "enum": [
        "facile",
        "moyen",
        "difficile"
      ],
      "default": "moyen",
      "description": "Niveau de difficult\u00e9"
    },
    "estimated_minutes": {
      "type": "number",
      "description": "Temps estim\u00e9 en minutes"
    },
    "due_date": {
      "type": "string",
      "format": "date",
      "description": "Date limite"
    },
    "source": {
      "type": "string",
      "enum": [
        "manuel",
        "pronote",
        "ecoledirecte",
        "import",
        "photo"
      ],
      "default": "manuel",
      "description": "Source de la t\u00e2che"
    },
    "status": {
      "type": "string",
      "enum": [
        "a_faire",
        "en_cours",
        "termine"
      ],
      "default": "a_faire",
      "description": "Statut de la t\u00e2che"
    },
    "priority": {
      "type": "number",
      "description": "Priorit\u00e9 calcul\u00e9e (1-10)"
    },
    "last_reviewed": {
      "type": "string",
      "format": "date",
      "description": "Derni\u00e8re r\u00e9vision"
    },
    "review_count": {
      "type": "number",
      "default": 0,
      "description": "Nombre de r\u00e9visions"
    },
    "next_review_date": {
      "type": "string",
      "format": "date",
      "description": "Prochaine date de r\u00e9vision recommand\u00e9e"
    }
  },
  "required": [
    "title",
    "subject"
  ]
}