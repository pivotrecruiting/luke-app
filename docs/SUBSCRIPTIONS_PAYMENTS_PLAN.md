# Subscriptions & Payments Plan (Stripe, MVP + skalierbar)

Ziel: Saubere, auditierbare Payment-Architektur mit Stripe als Source of Truth.

## Anforderungen (MVP)

- Drei Produkte/Preise:
  - 2.99 EUR monatlich (Subscription)
  - 29.99 EUR jaehrlich (Subscription)
  - 89.99 EUR lifetime (One-time purchase)
- Abwicklung via Stripe
- Zukunftssicher fuer Upgrades, Preiswechsel, Kuendigung, Entitlements
- Trial Codes mit variabler Laufzeit (trial days pro Code)
- Kuendigung und Planwechsel zum Periodenende (keine Proration/Refunds)
- 20% VAT (Oesterreich)

## Best Practices (Industrie-Standard)

- Stripe ist **Source of Truth** fuer Zahlungen/Subscriptions.
- Client ist **niemals** vertrauenswuerdig; Status nur via Webhooks aktualisieren.
- Idempotency Keys fuer alle Stripe-Calls.
- Event-Log speichern (raw Webhook Payload) fuer Audit/Debugging.
- Entitlements getrennt halten (Feature-Zugriff nicht direkt an Subscription-Status koppeln).
- Keine Kreditkartendaten speichern; nur Stripe-IDs.
- Environment-Trennung (test/live) + `livemode` Flag speichern.

## Architektur (High-Level)

1) **Checkout Session** (backend)
   - Monthly/Yearly: Stripe Checkout Session mit `mode=subscription`
   - Lifetime: Stripe Checkout Session mit `mode=payment`
   - `client_reference_id`/`metadata.user_id` setzen
   - Trial: `subscription_data.trial_period_days` aus Trial-Code setzen
   - Planwechsel: `proration_behavior=none`, `billing_cycle_anchor` auf Periodenende

2) **Webhook Listener** (backend)
   - Validiert Stripe Signatur
   - Verarbeitet Events:
     - `checkout.session.completed`
     - `customer.subscription.created|updated|deleted`
     - `invoice.paid|payment_failed`
     - `payment_intent.succeeded` (lifetime)
   - Aktualisiert lokale Tabellen (Subscriptions, Purchases, Entitlements)

3) **Entitlements**
   - Einheitliche Tabelle fuer Zugriffsrechte
   - Subscription und Lifetime schreiben in dieselbe Access-Logik
   - Entitlement-Key vorerst: `pro`

## MVP Data Model (Vorschlag)

### 1) billing_customers
- user_id (FK -> users.id, unique)
- stripe_customer_id (unique)
- livemode (bool)
- created_at

### 2) subscription_plans (Lookup)
- id (uuid)
- code (e.g. monthly, yearly, lifetime)
- name
- stripe_product_id
- stripe_price_id
- price_amount_cents
- currency
- billing_interval (monthly/yearly/one_time)
- active

### 3) subscriptions
- id
- user_id
- stripe_subscription_id (unique)
- stripe_price_id
- status (trialing/active/past_due/canceled/unpaid)
- current_period_start
- current_period_end
- cancel_at_period_end
- canceled_at
- trial_start
- trial_end
- trial_code_id (nullable)
- livemode
- created_at, updated_at

### 4) purchases (one-time)
- id
- user_id
- stripe_payment_intent_id (unique)
- stripe_price_id
- amount_cents
- currency
- status (succeeded/failed/refunded)
- livemode
- created_at

### 5) entitlements
- id
- user_id
- source_type (subscription|lifetime)
- source_id (subscription_id or purchase_id)
- entitlement_key (e.g. "pro")
- status (active/revoked)
- starts_at
- ends_at (nullable for lifetime)
- created_at

### 6) payment_events (Audit)
- id
- stripe_event_id (unique)
- event_type
- payload (jsonb)
- livemode
- created_at

### 7) trial_codes
- id
- code (unique)
- trial_days
- max_redemptions (nullable)
- active
- starts_at (nullable)
- ends_at (nullable)
- created_at

### 8) trial_redemptions
- id
- trial_code_id (FK)
- user_id (FK)
- stripe_subscription_id (nullable)
- redeemed_at
- unique (trial_code_id, user_id)

## Flow Mapping (MVP)

- Checkout -> `checkout.session.completed`
  - Wenn `mode=subscription`: create/update `subscriptions` + `entitlements`
  - Wenn `mode=payment`: create `purchases` + `entitlements`
- `customer.subscription.updated|deleted`
  - Update `subscriptions.status` und `entitlements` entsprechend
- `invoice.paid` / `payment_intent.succeeded`
  - Confirm success
- Refunds -> `charge.refunded`
  - Update `purchases.status=refunded`, revoke entitlement

## Tax/VAT (AT, 20%)

- Best Practice: Stripe Tax nutzen oder feste Tax Rate in Stripe anlegen (20% AT).
- Steuerberechnung erfolgt auf Stripe; lokale DB speichert nur IDs/Events.
- Optional spaeter: eigene Invoice-Tabelle fuer Reporting (tax_amount_cents, subtotal, total).

## TODOs fuer Start

- Stripe Produkte + Preise anlegen, IDs liefern
- Webhook Endpunkt implementieren
- RLS Policies fuer alle Billing-Tabellen
- Trial Codes definieren (Codes, Tage, Limits)
- Tax/VAT im Stripe Dashboard konfigurieren (20% AT)
