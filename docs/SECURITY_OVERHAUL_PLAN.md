# Security Overhaul Plan

Stand: 2026-03-31

## Ziel

Direkte clientseitige Rohzugriffe auf sensible Finanztabellen aus den kritischen Pfaden entfernen und durch serverseitige RPCs ersetzen.

## Phase 1: Scope und Zielbild

- [x] Kritische clientseitige Datenzugriffe identifizieren
- [x] Nicht-kritische SDK-/Auth-Pfade aus dem Scope entfernen
- [x] Zielbild festlegen: server-authoritative Reads und Mutations fuer Finanzdaten

## Phase 2: DB Read Layer

- [x] Migration fuer serverseitige Read-RPCs anlegen
- [x] Helper fuer User-/Onboarding-Bootstrap serverseitig kapseln
- [x] Wiederkehrende Monats-Transaktionen serverseitig erzeugen
- [x] Aggregierten App-Bootstrap-Read als RPC bereitstellen
- [x] Monthly-Balance-State als separaten RPC bereitstellen

## Phase 3: DB Write Layer

- [x] Migration fuer serverseitige Mutation-RPCs anlegen
- [x] Profilmutationen serverseitig kapseln
- [x] Income-/Expense-Mutationen serverseitig kapseln
- [x] Goal-/Contribution-Mutationen serverseitig kapseln
- [x] Budget-/Transaction-/Vault-Mutationen serverseitig kapseln
- [x] Reset-Flow serverseitig kapseln
- [x] Onboarding-Status serverseitig kapseln

## Phase 4: Client Refactor

- [x] `client/services/app-service.ts` auf RPC-Layer umstellen
- [x] kritische direkte `.from(...)`-Zugriffe aus `app-service.ts` entfernen
- [x] `client/services/access-service.ts` fuer User-Bootstrap auf RPC umstellen
- [x] bestehende Client-Signaturen soweit moeglich stabil halten

## Phase 5: Verifikation und Restpunkte

- [x] Code gegen verbleibende direkte kritische Tabellenzugriffe pruefen
- [x] Doku mit umgesetztem Stand aktualisieren
- [x] verbleibende Risiken knapp dokumentieren

## Restpunkte

- [x] Kritische Finanz-Reads und -Writes laufen nicht mehr ueber direkte `.from(...)`-Aufrufe im Client
- [x] TypeScript-Check erfolgreich ausgefuehrt
- [ ] Migrationsdateien in der Ziel-Datenbank ausfuehren
- [ ] Danach die neuen RPCs einmal gegen eine reale Supabase-Instanz smoke-testen
