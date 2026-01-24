{
  "name": "Subscription",
  "type": "object",
  "properties": {
    "plan": {
      "type": "string",
      "enum": [
        "free",
        "premium"
      ],
      "default": "free",
      "description": "Plan d'abonnement"
    },
    "stripe_customer_id": {
      "type": "string",
      "description": "ID client Stripe"
    },
    "stripe_subscription_id": {
      "type": "string",
      "description": "ID abonnement Stripe"
    },
    "subscription_start_date": {
      "type": "string",
      "format": "date",
      "description": "Date de d\u00e9but"
    },
    "subscription_end_date": {
      "type": "string",
      "format": "date",
      "description": "Date de fin"
    },
    "is_active": {
      "type": "boolean",
      "default": false,
      "description": "Abonnement actif"
    }
  },
  "required": []
}