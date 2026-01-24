{
  "name": "StudySession",
  "type": "object",
  "properties": {
    "task_id": {
      "type": "string",
      "description": "ID de la t\u00e2che associ\u00e9e"
    },
    "scheduled_date": {
      "type": "string",
      "format": "date",
      "description": "Date planifi\u00e9e"
    },
    "start_time": {
      "type": "string",
      "description": "Heure de d\u00e9but (HH:MM)"
    },
    "duration_minutes": {
      "type": "number",
      "description": "Dur\u00e9e en minutes"
    },
    "completed": {
      "type": "boolean",
      "default": false,
      "description": "Session termin\u00e9e"
    }
  },
  "required": [
    "task_id",
    "scheduled_date",
    "duration_minutes"
  ]
}