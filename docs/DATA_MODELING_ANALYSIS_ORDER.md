# Reihenfolge fuer Analyse und Datenmodellierung

Ziel: Klare Reihenfolge, welche Funktionalitaeten und Dateien wir analysieren, um daraus schrittweise konsistente Datenmodelle und am Ende die Gesamt-DB-Struktur abzuleiten.

## Startpunkt und Endpunkt

- Start: Onboarding + Basisprofil (erste Datenquelle fuer Income/Expenses/Budgets/Goals)
- Ende: Settings/Profile + Paywall/Subscription + finale DB-Struktur

## Reihenfolge (Feature -> Dateien)

1) Fundament / Basisschichten
   - `client/context/AppContext.tsx` (SSOT im Client, aktuelle Datenstrukturen)
   - `client/lib/query-client.ts` (API-Shape, spaeterer Server-Vertrag)
   - `shared/schema.ts` (bestehende DB-Typen)
   - `server/storage.ts`, `server/routes.ts` (Server-Seite, aktueller Stand)

2) Onboarding (Datenaufnahme)
   - `client/screens/WelcomeScreen.tsx`
   - `client/screens/SignUpScreen.tsx`
   - `client/screens/onboarding/Onboarding1Screen.tsx` (Currency)
   - `client/screens/onboarding/Onboarding2Screen.tsx` (Goals)
   - `client/screens/onboarding/Onboarding3Screen.tsx` (Erspartes)
   - `client/screens/onboarding/Onboarding4Screen.tsx` (Sparziel)
   - `client/screens/onboarding/Onboarding5Screen.tsx` (Einkommen)
   - `client/screens/onboarding/Onboarding6Screen.tsx` (Fixkosten)
   - `client/screens/onboarding/Onboarding7Screen.tsx` (Spielraum)
   - `client/screens/onboarding/Onboarding8Screen.tsx` (Budgets)
   - `client/screens/PaywallScreen.tsx`
   - `client/constants/budgetCategories.ts`

3) Einnahmen/Ausgaben-Uebersicht (Kern-Transaktionen)
   - `client/screens/HomeScreen.tsx`
   - `client/screens/InsightsScreen.tsx`
   - `client/screens/AddScreen.tsx`
   - `client/screens/IncomeScreen.tsx`
   - `client/screens/ExpensesScreen.tsx`

4) Budgets und Kategorien
   - `client/screens/BudgetDetailScreen.tsx`
   - `client/constants/budgetCategories.ts`
   - relevante UI/Komponenten aus `client/components/*` (falls Logik)

5) Goals/Sparziele
   - `client/screens/GoalsScreen.tsx`
   - `client/screens/GoalDetailScreen.tsx`

6) Profil/Settings/Meta
   - `client/screens/ProfileScreen.tsx`
   - evtl. `client/hooks/*` und `client/constants/*` (User Preferences)

7) Server-API und Persistenz
   - `server/routes.ts` (Endpunkte definieren)
   - `server/storage.ts` (Persistence-Adapter)
   - `shared/schema.ts` (DB-Modelle finalisieren)

## Output pro Abschnitt

- Entity-Liste + Beziehungen
- Feldliste mit Typen, Constraints, Defaults
- SSOT vs. abgeleitete Felder
- Entscheidungslog (kurz)
