{
  "name": "Reward",
  "type": "object",
  "properties": {
    "points": {
      "type": "number",
      "default": 0,
      "description": "Points accumul\u00e9s"
    },
    "total_tasks_completed": {
      "type": "number",
      "default": 0,
      "description": "Nombre total de t\u00e2ches termin\u00e9es"
    },
    "current_streak": {
      "type": "number",
      "default": 0,
      "description": "S\u00e9rie de jours cons\u00e9cutifs"
    },
    "best_streak": {
      "type": "number",
      "default": 0,
      "description": "Meilleure s\u00e9rie"
    },
    "last_activity_date": {
      "type": "string",
      "format": "date",
      "description": "Derni\u00e8re activit\u00e9"
    },
    "level": {
      "type": "number",
      "default": 1,
      "description": "Niveau actuel"
    }
  },
  "required": []
}