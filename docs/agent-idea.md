# Idée pour générer un agent StudyPlan

## Agent « Coach IA »
- Analyse les devoirs importés (Pronote / École Directe / saisie) et génère un plan hebdomadaire.
- Détecte les périodes chargées et propose un rééquilibrage automatique.
- Fournit des rappels intelligents (« short burst study », micro-sessions).
- Collecte des feedbacks utilisateur pour ajuster la difficulté et les durées.

## MVP technique
1. Une file d'événements côté backend (tâches créées/modifiées).
2. Un worker qui calcule les sessions optimales.
3. Un endpoint `POST /api/agent/plan` pour lancer un recalcul.
4. Un dashboard admin pour suivre les recalculs et les erreurs.
