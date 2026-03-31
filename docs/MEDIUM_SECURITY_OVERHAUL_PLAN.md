# Medium Security Overhaul Plan

Stand: 2026-03-31

## Ziel

Verbleibende mittlere Sicherheitsrisiken nach dem Critical-Overhaul beseitigen, ohne den bestehenden Auth-/Billing-Grundfluss unnötig umzubauen.

## Ursprüngliche Medium Risks

- unverschlüsselte lokale Persistenz von App-Fallback-Daten in `AsyncStorage`
- unverschlüsselte Persistenz sensibler Onboarding-Finanzentwürfe in `AsyncStorage`
- access-relevanter Workshop-Code lokal im unverschlüsselten Storage
- redundante Verteilung des Workshop-Codes in Auth-Metadaten
- XP bleibt client-authoritative und ist manipulierbar
- Supabase-Session kann bei Storage-Fallback in `AsyncStorage` landen

## Phase 1: Lokale Persistenz minimieren

- [x] Plan und Scope dokumentieren
- [x] persistierte App-Fallback-Daten auf nicht-sensitive Minimalwerte reduzieren
- [x] persistierte Onboarding-Finanzentwürfe aus `AsyncStorage` entfernen
- [x] Workshop-Code lokal in sicheren Storage verschieben, wenn verfügbar
- [x] redundantes Schreiben von `pending_workshop_code` in Auth-Metadaten entfernen

## Phase 2: Session Storage härten

- [x] Auth-Storage so umbauen, dass Session-Tokens auf nativen Clients nicht in `AsyncStorage` landen
- [x] `SecureStore`-Chunking für große Session-Payloads auf nativen Clients umsetzen
- [x] Legacy-Migration von vorhandenem nativen `AsyncStorage`-Auth-State nach `SecureStore` ergänzen
- [x] nativen Fallback ohne Disk-Persistenz auf In-Memory-Storage begrenzen
- [x] statischen Smoke-Test via TypeScript, Lint und Storage-Pfad-Audit durchführen

## Phase 3: XP server-authoritative machen

- [x] XP-Read-/Write-Flows in serverseitige RPCs verschieben
- [x] Cooldown-, Max-Per-User- und Award-Logik serverseitig erzwingen
- [x] Daily-Login- und Streak-Bonus serverseitig kapseln
- [x] Client auf Anzeige- und Trigger-Rolle reduzieren
- [x] lokale Migration fuer die neuen XP-RPCs anlegen

## Phase 4: Abschluss und Audit

- [x] verbleibende Medium-Risiken erneut prüfen
- [x] Sicherheitsinventur auf den neuen Stand aktualisieren
- [x] statischen Smoke-Test der geänderten Flows durchführen
- [ ] Runtime-Smoke-Test gegen die reale DB nach Anwendung von `migrations/026_secure_xp_rpcs.sql`

## Ergebnis

Medium-Risiken sind im Code- und Architektur-Scope abgearbeitet. Offener Rest ist nur noch der reale Runtime-Smoke-Test der neuen XP-RPCs nach Deployment der Migration.
