# Onboarding Dataflow (Ist) + benoetigte Daten (Soll)

Ziel: Grobe, belastbare Basis fuer die spaetere DB-Planung und fuer eine saubere Single-Source-of-Truth (SSOT).

## Ist: Dataflow im aktuellen Code

### Flow-Reihenfolge und Datenaufnahme

| Schritt | Screen | Eingaben | Persistenz | Ziel im State |
| --- | --- | --- | --- | --- |
| 0 | `client/screens/WelcomeScreen.tsx` | keine | keine | nur Navigation -> SignUp |
| 1 | `client/screens/SignUpScreen.tsx` | Email (lokaler State) | keine | nicht verwendet, nur Navigation -> OnboardingCurrency |
| 2 | `client/screens/OnboardingCurrencyScreen.tsx` | Standardwaehrung (EUR/USD/CHF) | **ja** | `setCurrency()` -> `AppContext.currency` |
| 3 | `client/screens/Onboarding1Screen.tsx` | Gruende/Goals (Mehrfachauswahl) | keine | nicht gespeichert |
| 4 | `client/screens/Onboarding2Screen.tsx` | Erspartes (CurrencyInput) | keine | nicht gespeichert |
| 5 | `client/screens/Onboarding3Screen.tsx` | Sparziel: Name, Zielbetrag, monatlicher Beitrag | **teilweise** | `addGoal()` -> `AppContext.goals` (monatlicher Beitrag wird **nicht** gespeichert) |
| 6 | `client/screens/Onboarding4Screen.tsx` | Einkommen (Typ + Betrag, mehrfach) | **ja** | `setIncomeEntries()` -> `AppContext.incomeEntries` |
| 7 | `client/screens/Onboarding5Screen.tsx` | Fixkosten (Typ + Betrag, mehrfach) | **ja** | `setExpenseEntries()` -> `AppContext.expenseEntries` |
| 8 | `client/screens/Onboarding6Screen.tsx` | keine neue Eingabe | n/a | berechnet `verfuegbar = totalIncome - totalFixedExpenses` |
| 9 | `client/screens/Onboarding7Screen.tsx` | Budgets (Kategorie + Limit, mehrfach) | **ja** | `addBudget()` -> `AppContext.budgets` |
| 10 | `client/screens/PaywallScreen.tsx` | keine | keine | Reset auf `Main`, **kein** `completeOnboarding()` |

### Zentrale Datenhaltung (Client)

- SSOT im Client ist aktuell `client/context/AppContext.tsx`.
- Persistenz via AsyncStorage (`STORAGE_KEY = "@luke_app_data"`).
- Persistierte Felder:
  - `isOnboardingComplete`
  - `currency`
  - `incomeEntries`
  - `expenseEntries`
  - `goals`
  - `budgets`
  - `transactions`
  - `lastBudgetResetMonth`
- **Wichtig:** `TEST_MODE = true` setzt `isOnboardingComplete` immer auf `false`.
- `completeOnboarding()` existiert, wird aber aktuell **nicht** aufgerufen.

### Derivierte Werte (nicht speichern, sondern berechnen)

Diese Werte sollten aus SSOT berechnet bleiben (keine Persistenz in DB, ausser fuer Reporting-Snapshots):

- `totalIncome`, `totalFixedExpenses`, `monthlyBudget`, `totalVariableExpenses`, `totalExpenses`
- `balance`, `savingsRate`
- `weeklySpending`, `monthlyTrendData`

## Soll: Benoetigte Daten aus dem Onboarding (DB-relevant)

### 1) User/Account (Grundlage)

- `user_id` (PK)
- `email` (optional, falls Social Auth) / `auth_provider` / `auth_provider_id`
- `created_at`
- optional: `display_name`

### 2) Onboarding-Status

- `onboarding_completed_at`
- `onboarding_version` (falls UI/Flow spaeter aendert)
- optionale `onboarding_skips` (welche Steps wurden uebersprungen)

### 3) Onboarding-Inputdaten (fachlich)

- **Motivationen** (Onboarding1): Liste der gewaehlten Ziele/Reasons
  - Beispiel: `onboarding_goals[] = ["Ueberblick", "Abos", ...]`
- **Start-Ruecklage** (Onboarding2):
  - `initial_savings_amount` (numeric)
  - `currency` (z.B. "EUR")
  - `as_of_date` (optional, default = now)
- **Erstes Sparziel** (Onboarding3):
  - `goal_name`
  - `target_amount`
  - `monthly_contribution` (aktuell erfasst, aber nicht gespeichert)
  - `icon`
  - `created_in_onboarding` (bool)

### 4) Finanz-Basisdaten (Kern fuer spaetere Features)

- **Income Sources** (Onboarding4):
  - `income_source_id` (PK)
  - `user_id` (FK)
  - `type` / `category`
  - `amount`
  - `frequency` (aktueller Flow impliziert `monthly`)
  - `currency`
  - `start_date`

- **Fixed Expenses** (Onboarding5):
  - `fixed_expense_id` (PK)
  - `user_id` (FK)
  - `type` / `category`
  - `amount`
  - `frequency` (monthly)
  - `currency`
  - `start_date`

- **Budgets** (Onboarding7):
  - `budget_id` (PK)
  - `user_id` (FK)
  - `budget_category_id` (FK, Referenztabelle)
  - `limit_amount`
  - `period` (monthly)
  - `currency`
  - `start_date`

- **Budget Categories** (Referenz):
  - `budget_category_id` (PK)
  - `name`
  - `icon`
  - `color`

## Gaps/Inkonsistenzen (aktueller Stand)

- Onboarding1 (Motivation), Onboarding2 (Ersparnisse) werden **nicht** gespeichert.
- Onboarding3 speichert `goal_name` + `target_amount`, aber **nicht** den `monthly_contribution`.
- `SignUpScreen` sammelt Email, speichert sie aber nicht.
- `completeOnboarding()` wird nirgends aufgerufen; zudem wird `isOnboardingComplete` durch `TEST_MODE` immer `false`.

## Empfehlung fuer SSOT

- Alle Onboarding-Eingaben muessen in **eine** kanonische Quelle fliessen (Backend/DB).
- Client sollte nur lokale, kurzlebige Drafts halten und nach dem Onboarding einmalig persistieren.
- Abgeleitete Werte (Budgetsumme, Spielraum, Savings Rate) **nicht** persistieren, sondern berechnen.
