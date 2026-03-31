# Billing Schema (RevenueCat + Supabase Access)

Hinweis: Basis-Tabellen `public.users`, `public.roles`, `public.user_roles` sind vorgegeben.

## Ziel

Luke nutzt kein Stripe-zentriertes Billing-Schema mehr. Die Architektur basiert auf:

- RevenueCat als Billing- und Store-Lifecycle-Quelle
- Supabase als serverseitige Access-Quelle
- `user_access_grants` als einheitliches Zugriffsmodell
- `billing_config` fuer DB-gesteuerte Trial- und Paywall-Regeln
- `billing_products` und `billing_product_store_mappings` als store-neutrales Produktmodell

## Kernprinzipien

- Der Client ist nicht vertrauenswuerdig fuer finale Access-Freischaltung.
- RevenueCat-Webhooks schreiben serverseitig in Supabase.
- Der Standard-Testzeitraum kommt aus der DB, nicht aus Store-Trials.
- Die Paywall-Sichtbarkeit wird serverseitig berechnet.
- Alte Stripe-Tabellen sind Legacy und werden entfernt.

## Aktives Zielschema

### 1) `billing_config`

Globale Billing- und Paywall-Konfiguration.

```sql
create table public.billing_config (
  config_key text primary key default 'default',
  pro_access_key text not null default 'pro',
  default_trial_days integer not null default 7,
  paywall_show_days_before_expiry integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Verwendung:

- `default_trial_days`: Standard-Testzeitraum fuer jeden User
- `paywall_show_days_before_expiry`: Ab wann die Paywall vor Trial-Ende erscheinen darf
- `pro_access_key`: gemeinsamer Access-Key fuer Trial, RevenueCat-Kauf und Workshop-Code

### 2) `billing_products`

Interner, store-neutraler Produktkatalog.

```sql
create table public.billing_products (
  id uuid primary key default gen_random_uuid(),
  product_key text not null unique,
  display_name text not null,
  entitlement_key text not null default 'pro',
  product_type text not null,
  billing_interval text not null,
  price_amount_cents integer not null,
  currency public.currency_code not null,
  sort_order integer not null default 100,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Beispiele:

- `monthly`
- `yearly`
- `lifetime`

### 3) `billing_product_store_mappings`

Store- und RevenueCat-spezifische Zuordnung pro Plattform.

```sql
create table public.billing_product_store_mappings (
  id uuid primary key default gen_random_uuid(),
  billing_product_id uuid not null references public.billing_products (id) on delete cascade,
  platform text not null,
  store_product_id text not null,
  revenuecat_entitlement_id text not null default 'pro',
  revenuecat_offering_id text not null default 'default',
  revenuecat_package_identifier text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Zweck:

- iOS- und Android-Produkt-IDs sauber trennen
- RevenueCat-Offering und Package explizit dokumentieren
- App-Logik nicht an alte Stripe-Felder koppeln

### 4) `user_access_grants`

Einheitliche Access-Schicht fuer Luke.

Diese Tabelle ist die entscheidende App-seitige Zugriffsquelle. Sie deckt ab:

- `app_trial`
- `revenuecat`
- `workshop_code`
- `admin`
- `legacy_trial`

Beispiele:

- Standard-Trial mit `source_type = 'app_trial'`
- Kauf ueber RevenueCat mit `source_type = 'revenuecat'`
- Workshop-Code-Zugang mit `source_type = 'workshop_code'`

### 5) `revenuecat_customers`

Zuordnung von Luke-User zu RevenueCat `app_user_id`.

Wichtig:

- `app_user_id` soll dem Supabase-`users.id` entsprechen
- Alias- und Transfer-Faelle werden hier dokumentiert

### 6) `revenuecat_events`

Event-Log fuer Webhooks und Idempotenz.

Zweck:

- Audit
- Debugging
- Schutz vor Doppelverarbeitung
- Nachvollziehbarkeit von `INITIAL_PURCHASE`, `RENEWAL`, `EXPIRATION` usw.

### 7) `workshop_codes` und `workshop_code_redemptions`

Bleiben bestehen, weil sie bereits auf `user_access_grants` aufsetzen und damit mit der neuen Access-Architektur kompatibel sind.

## Wichtige RPCs / Serverlogik

### `ensure_default_app_trial()`

Vergibt den DB-gesteuerten Standard-Testzeitraum genau einmal pro User.

Ergebnis:

- erzeugt bei Bedarf einen `app_trial`-Grant
- berechnet `paywall_visible_from`
- verhindert doppelte Trial-Vergabe

### `get_my_access_state()`

Liefert den serverseitig massgeblichen Access- und Paywall-Status.

Wichtige Felder:

- `has_access`
- `access_key`
- `source_type`
- `active_until`
- `paywall_required`
- `trial_ends_at`
- `paywall_visible_from`
- `paywall_visible`
- `days_until_expiry`

## Entfernte Legacy-Struktur

Die folgende Stripe-MVP-Struktur ist nicht mehr Teil des Zielbilds:

- `billing_customers`
- `subscription_plans`
- `subscriptions`
- `purchases`
- `entitlements`
- `payment_events`
- `trial_codes`
- `trial_redemptions`

Diese Tabellen waren fuer Stripe sinnvoll, sind fuer RevenueCat in Luke aber fachlich und semantisch die falsche Ebene.

## Warum das bessere Modell

- Access und Billing-Lifecycle sind sauber getrennt.
- Trial-Regeln lassen sich ohne App-Release ueber die DB steuern.
- RevenueCat-Store-Details sind modelliert, ohne den Rest der App zu verschmutzen.
- Das Schema bleibt fuer iOS und Android gemeinsam nutzbar.
- Alte Stripe-Begriffe erzeugen keine semantische Verwirrung mehr.
