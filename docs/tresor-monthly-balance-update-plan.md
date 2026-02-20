# Tresor & Monatsbalance – Aktualisierungsplan

## Zielbild
- Balance zeigt nur noch die laufende Monatsbalance.
- Am Monatswechsel wird die Restbalance (positiv oder negativ) automatisch in den Tresor gebucht.
- Tresor wird in der Goals-Übersicht oberhalb der Goals angezeigt.
- Neuer Tresor-Screen zeigt alle Tresor-Transaktionen und erlaubt manuelle Einzahlungen aus der aktuellen Monatsbalance.
- Goal-Einzahlungen werden ausschließlich aus dem Tresor finanziert.

## TODO-Liste (fortlaufend abgehakt)

### 1. Analyse & Planung
- [x] Bestehende UI-/State-/Dataflow-Logik analysieren (`GoalsScreen`, `GoalDetailScreen`, `AppContext`, Insights).
- [x] Supabase-Schema via MCP prüfen (Tabellen, Spalten, RLS-Status).
- [x] Konkretes Ziel-Datenmodell finalisieren (Tresor-Transaktionen + Monatsanker).

### 2. Datenbank & Migrationen
- [x] Lokale Migration für `vault_transactions` erstellen.
- [x] Lokale Migration für Monatsanker in `user_financial_profiles` erstellen.
- [x] RLS/Policies/Indizes für neue Strukturen ergänzen.

### 3. Service-Layer & Typen
- [x] Service-Typen (`client/services/types.ts`) um Tresor-Row-Typen erweitern.
- [x] `fetchAppData` und AppData-Payload um Tresor-Daten + Monatsanker erweitern.
- [x] Service-Funktionen für Tresor-Transaktionen und Monatsanker-Update ergänzen.

### 4. App State, Persistenz & Monatsreset
- [x] App-Types (`client/context/app/types.ts`) um Tresor-Modelle/State erweitern.
- [x] Local Persistence (`PersistedData`, Loader, Saver) um neue Felder erweitern.
- [x] Monatsrollover-Logik implementieren (idempotent, inkl. verpasster Monate via Monatsanker).
- [x] Monatsbalance als eigene abgeleitete Kennzahl implementieren.

### 5. Fachlogik Tresor/Goals
- [x] Manuelle Einzahlung in Tresor (nur bis zur verfügbaren Monatsbalance) implementieren.
- [x] Goal-Deposit-Flow auf Tresor als Quelle umbauen.
- [x] Goal-Deposit Edit/Delete so anpassen, dass Tresor konsistent mitgeführt wird.

### 6. UI & Navigation
- [x] GoalsScreen: Tresor-Card oberhalb Goals integrieren.
- [x] Navigation: neuen `Vault`-Screen in RootStack ergänzen.
- [x] Neuen `VaultScreen` (Verlauf + Plus-Flow) erstellen.
- [x] Goal-Detail Modal: verfügbaren Tresor anzeigen und Save-Limits validieren.
- [x] Insights Balance-Komponente auf Monatsbalance umstellen.

### 7. Qualitätssicherung
- [x] Type-/Lint-Checks für geänderte Dateien ausführen.
- [ ] Kurzer Funktionstest der Kernflows (manuell) durchführen.
- [x] Plan-Dokument final mit Status/Ergebnis aktualisieren.

## Änderungsprotokoll
- 2026-02-20: Plan erstellt, Analyse und MCP-Schema-Prüfung abgeschlossen.
- 2026-02-20: Migration `migrations/013_add_vault_transactions_and_month_balance_anchor.sql` erstellt.
- 2026-02-20: AppContext/Service/Goals/Insights auf Tresor- und Monatsbalance-Logik erweitert.
- 2026-02-20: Neuer `client/screens/VaultScreen.tsx` und Tresor-Card im `GoalsScreen` integriert.
- 2026-02-20: Geänderte Dateien per `prettier` formatiert und per gezieltem `eslint` geprüft.
