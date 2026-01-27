# Plan und Richtlinien fuer Datenmodelle

Ziel: Ein konsistenter, nachvollziehbarer Prozess, um Datenmodelle schrittweise zu analysieren, zu definieren und in eine saubere DB-Struktur zu ueberfuehren (Single Source of Truth).

## Leitprinzipien (Best Practices)

- Single Source of Truth (SSOT): Es gibt genau eine kanonische Quelle pro Datenobjekt (DB). Client haelt nur temporaere Drafts.
- Trenne Rohdaten vs. Ableitungen: Aggregationen und Kennzahlen werden berechnet, nicht persistiert (ausser Reporting-Snapshots).
- Klare Ownership: Jedes Feld ist genau einem Entity zugeordnet; kein doppeltes Speichern.
- Normalisierung zuerst: 3NF als Default; Denormalisierung nur gezielt fuer Performance.
- Strenge Constraints: NOT NULL, UNIQUE, CHECK, FK, DEFAULT. Fehler frueh erzwingen.
- Auditierbarkeit: created_at/updated_at; optional soft delete (deleted_at) pro Tabelle.
- Zeit und Geld korrekt: Geld als Integer in Cents + currency (ISO 4217), Zeitstempel in UTC.
- Stabilitaet vor Features: Schema-Entscheidungen zuerst, UI/Flows danach anpassen.
- Evolvierbarkeit: Migrations faehig, klare Versionierung (z. B. onboarding_version).

## Namenskonventionen

- Tabellen: plural, snake_case (z. B. users, income_sources)
- PK: id (UUID)
- FK: <table>_id (z. B. user_id, budget_id)
- Timestamps: created_at, updated_at, deleted_at
- Boolean: is_*, has_*
- Enumerationen: text + CHECK oder eigene Lookup-Tabelle

## Datenqualitaet und Konsistenz

- Pflichtfelder explizit definieren (NOT NULL)
- Eindeutigkeit auf fachlich relevanten Schluesseln (z. B. user_id + name)
- CHECK-Constraints fuer Wertebereiche (>= 0, <= 1.0, etc.)
- FK-Constraints fuer Referenzen (ON DELETE behavior festlegen)

## Vorgegebene Basis-Tabellen (fix)

Diese Tabellen sind gesetzt und bilden die Grundlage fuer alle weiteren Modelle:

- `public.users` (FK auf `auth.users`, Felder: id, name, status, avatar, created_at, updated_at)
- `public.roles`
- `public.user_roles`

Automationen/Funktionen:

- Trigger-Funktion (bei `auth.users`): erzeugt/aktualisiert `public.users`, weist Rolle `client` zu
- `has_role(role_name text)` fuer RLS-Pruefungen

## Datentypen und Berechnung

- Geld: amount_cents (integer), currency (char(3))
- Prozentwerte: decimal (0..100) oder integer_basis (0..10000) je nach Genauigkeit
- Zeit: timestamptz in UTC
- Perioden/Frequenzen: enum (monthly, weekly, yearly) oder eigene Tabelle
- Ableitungen (z. B. totals, balance): nur als View oder Query berechnen

## Prozess (Pro Feature-Abschnitt)

1) Scope definieren
   - Welche Screens/Flows gehoeren dazu?
   - Welche Inputs und Outputs existieren?

2) Ist-Analyse (Code)
   - Welche Daten werden aktuell erfasst?
   - Wo liegen sie im Client State?
   - Welche Daten sind nur UI/Draft?

3) Datenmodell Entwurf
   - Entities + Beziehungen
   - Attributliste pro Entity
   - Kardinalitaeten (1:N, N:M)

4) SSOT-Entscheidung
   - Welche Felder sind kanonisch?
   - Welche Felder sind abgeleitet?

5) Constraints + Indizes
   - NOT NULL, UNIQUE, CHECK, FK
   - Indizes fuer query-kritische Felder

6) Validierung gegen Use-Cases
   - Passt das Modell zu allen Flows?
   - Gibt es Redundanz oder Inkonsistenz?

7) Output-Artefakte
   - Datenmodell-Skizze (Entity List)
   - Data Dictionary (Feldbeschreibung)
   - Anpassungen am Client/Server (falls noetig)

## Feature-Reihenfolge (Roadmap)

Phase 0: Basis
- Vorgegebene Tabellen: users, roles, user_roles (fix) + Onboarding-Status

Phase 1: Onboarding
- Motivationen, Initial Savings, Erstes Goal, Income Sources, Fixed Expenses, Budgets

Phase 2: Einnahmen/Ausgaben Uebersicht
- Transactions, Kategorien, Summaries (nur berechnet)

Phase 3: Budgets
- BudgetPerioden, Budget-Spending, Budget-Categories

Phase 4: Goals/Sparziele
- Goals, GoalDeposits, GoalStatus

Phase 5: Insights/Reports
- Optional Snapshot/Materialized Views

Phase 6: Paywall/Subscriptions
- SubscriptionStatus, Entitlements

Phase 7: Settings/Profile
- User Preferences, Locale, Currency

## Entscheidungsprotokoll (Decision Log)

Jede relevante Modell-Entscheidung wird dokumentiert:
- Problem
- Optionen
- Entscheidung
- Begruendung
- Auswirkungen

## Akzeptanzkriterien pro Feature

- Vollstaendige Entity-Liste mit Beziehungen
- Feldliste inkl. Typen und Constraints
- Klar definierte SSOT vs. Ableitungen
- Keine Dopplung der gleichen Information
- Abgleich mit existierendem UI-Flow

## Naechste Schritte

- Start mit Phase 1 (Onboarding): Entities entwerfen und als Basis fuer die DB-Struktur definieren.
- Danach Phase 2 (Einnahmen/Ausgaben) mit Fokus auf Transactions.
