# Subscriptions & Payments Plan (RevenueCat + Supabase)

Ziel: Saubere, auditierbare Mobile-Billing-Architektur mit RevenueCat als Billing-Layer und Supabase als Access-Layer.

## Produktregeln

- Jeder User erhaelt einen Standard-Testzeitraum von 7 Tagen.
- Die Trial-Konfiguration wird aus der DB geladen.
- Das Paywall-Modal wird erst 3 Tage vor Trial-Ende angezeigt.
- Drei kaufbare Produkte:
  - `monthly`
  - `yearly`
  - `lifetime`
- `lifetime` gewaehrt dauerhaften Zugriff.
- Alle Zugriffswege muessen denselben `pro`-Access aktivieren.

## Best Practices

- RevenueCat ist Source of Truth fuer Store-Kaeufe und Subscription-Lifecycle.
- Supabase ist Source of Truth fuer Luke-Feature-Access.
- Der Client schaltet Features nie final selbst frei.
- Alle RevenueCat-Webhooks werden serverseitig verarbeitet und auditiert.
- Der Standard-Trial ist ein App-Grant aus der DB und kein Store-Intro-Offer.
- Preise und Produktdarstellung kommen nicht aus Hardcodes, sondern aus dem Produktkatalog bzw. RevenueCat.
- Alte Stripe-Strukturen werden entfernt, nicht parallel weitergefuehrt.

## Zielarchitektur

1. **DB-gesteuerter Standard-Trial**
   - User bekommt serverseitig genau einen `app_trial`
   - Trial-Laufzeit und Paywall-Vorlauf kommen aus `billing_config`
   - `get_my_access_state()` steuert, ob die Paywall sichtbar sein darf

2. **RevenueCat fuer Kaeufe**
   - Monthly und Yearly als Auto-Renewable Subscriptions
   - Lifetime als One-Time Purchase
   - RevenueCat `app_user_id` entspricht `public.users.id`

3. **Supabase fuer Access**
   - RevenueCat-Webhooks schreiben in `user_access_grants`
   - Trial, RevenueCat, Workshop-Code und Admin-Zugriffe laufen in dieselbe Access-Schicht

4. **Store-neutrales Produktmodell**
   - `billing_products` als interne Produktquelle
   - `billing_product_store_mappings` fuer iOS-/Android-Produkt-IDs und RevenueCat-Zuordnung

## Server-Flows

### Trial-Vergabe

- Signup oder erster qualifizierter Session-Start
- `ensure_default_app_trial()`
- Falls noch kein Trial vergeben wurde:
  - `user_access_grants.source_type = 'app_trial'`
  - `ends_at = now() + default_trial_days`
  - `paywall_visible_from = ends_at - paywall_show_days_before_expiry`

### Access-State

- App fragt `get_my_access_state()` ab
- Rueckgabe steuert:
  - Zugriff ja/nein
  - Trial-Ende
  - Paywall-Sichtbarkeit
  - verbleibende Tage

### Kauf ueber RevenueCat

- App laedt Offering
- User kauft Monthly, Yearly oder Lifetime
- RevenueCat sendet Webhook
- Supabase verarbeitet Webhook idempotent
- `user_access_grants` wird erzeugt oder aktualisiert
- App bestaetigt Access ueber `get_my_access_state()`

## Datenmodell

### Aktiv

- `billing_config`
- `billing_products`
- `billing_product_store_mappings`
- `user_access_grants`
- `revenuecat_customers`
- `revenuecat_events`
- `workshop_codes`
- `workshop_code_redemptions`

### Legacy und zu entfernen

- `billing_customers`
- `subscription_plans`
- `subscriptions`
- `purchases`
- `entitlements`
- `payment_events`
- `trial_codes`
- `trial_redemptions`

## Webhook-Grundsaetze

- Raw Payload immer speichern
- Idempotenz ueber `event_id`
- Keine Access-Aenderung nur auf Client-Callback
- `CANCELLATION` entzieht nicht sofort den Zugriff
- `BILLING_ISSUE` entzieht nicht sofort den Zugriff
- `EXPIRATION` entzieht den Zugriff
- `NON_RENEWING_PURCHASE` erzeugt Lifetime-Access ohne `ends_at`

## Offene Implementierungspunkte

- RevenueCat Edge Function implementieren
- Client-Service fuer RevenueCat initialisieren
- Paywall-Screen auf echtes Offering-Mapping umstellen
- Access-State nach Signup, Session-Restore und Kauf sauber konsumieren
- Produktkatalog mit echten iOS-/Android-Store-IDs und RevenueCat-Packages fuellen
