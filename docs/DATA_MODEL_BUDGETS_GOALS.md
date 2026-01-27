# Datenmodell: Phase 3/4 – Budgets & Goals

Ziel: Kanonisches Modell fuer Budgets, Budget-Transaktionen und Sparziele inkl. Einzahlungen.

## Scope und Quellen

Quellen im Code:
- `client/screens/GoalsScreen.tsx`
- `client/screens/GoalDetailScreen.tsx`
- `client/screens/BudgetDetailScreen.tsx`
- `client/context/AppContext.tsx`
- `client/constants/budgetCategories.ts`
- `DATA_MODEL_TRANSACTIONS.md`

## Leitentscheidung (SSOT)

- **Variable Ausgaben** sind SSOT in `transactions` (type='expense').
- **Budgets** referenzieren diese Transaktionen via `budget_id`.
- **Budget-Current/Remaining** und **Goal-Current/Remaining** werden **berechnet** (nicht persistieren).

## Entitaeten und Beziehungen (Vorschlag)

1) budgets (bereits definiert)
2) budget_categories (Lookup, bereits definiert)
3) transactions (bereits definiert) -> optionaler Bezug auf budget_id
4) goals
5) goal_contributions (Einzahlungen/Rueckzahlungen)

Beziehungen (Kurzform):
- users 1:N budgets
- budget_categories 1:N budgets
- budgets 1:N transactions (nur expense)
- users 1:N goals
- goals 1:N goal_contributions
- goal_contributions optional -> transactions (1:1) fuer Timeline/Insights

## Data Dictionary (Kurzform)

### budgets
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| category_id | uuid | FK -> budget_categories.id | |
| name | text | NOT NULL | Snapshot/Label (optional, falls Kategorie umbenannt) |
| limit_amount_cents | integer | NOT NULL, CHECK >= 0 | Monatslimit |
| period | text | NOT NULL | CHECK = 'monthly' (MVP) |
| currency | char(3) | NOT NULL | CHECK in (EUR, USD, CHF) |
| start_date | date | NULLABLE | optionaler Start |
| is_active | boolean | NOT NULL, DEFAULT true | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

Hinweis: `current` und `remaining` werden aus `transactions` berechnet.

### goals
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| name | text | NOT NULL | Zielname |
| icon | text | NULLABLE | Emoji/Icon |
| target_amount_cents | integer | NOT NULL, CHECK >= 0 | Zielbetrag |
| monthly_contribution_cents | integer | NULLABLE | optional (Onboarding/Planung) |
| status | text | NOT NULL, DEFAULT 'active' | z. B. active/paused/reached |
| created_in_onboarding | boolean | NOT NULL, DEFAULT false | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

Hinweis: `current`/`remaining` werden aus `goal_contributions` berechnet.

### goal_contributions
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| goal_id | uuid | FK -> goals.id | |
| user_id | uuid | FK -> users.id | |
| amount_cents | integer | NOT NULL, CHECK >= 0 | Betrag |
| currency | char(3) | NOT NULL | CHECK in (EUR, USD, CHF) |
| contribution_type | text | NOT NULL | CHECK in ('deposit', 'repayment') |
| contribution_at | timestamptz | NOT NULL | Datum/Zeit |
| transaction_id | uuid | FK -> transactions.id, NULLABLE | optionaler Link zur Timeline |
| note | text | NULLABLE | optional |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

Indizes (empfohlen):
- (user_id, contribution_at)
- (goal_id, contribution_at)

## Mapping zum aktuellen UI

- `GoalsScreen`:
  - zeigt `goals` (berechnet current/remaining)
  - erstellt Goals (name, icon, target_amount)
  - erstellt Budgets (category, limit)

- `GoalDetailScreen`:
  - listet `goal_contributions` (nach Monat gruppiert)
  - Bearbeiten/Loeschen von Contributions

- `BudgetDetailScreen`:
  - listet Transaktionen gefiltert nach `budget_id`
  - Bearbeiten/Loeschen -> Update/Delete `transactions`

## Entscheidungen (Kurz)

- Budgets nutzen `transactions` als SSOT fuer Ausgaben (kein separates `budget_expenses` Modell).
- `name` als Snapshot bei `budgets`, falls Kategorie umbenannt wird.
- Goals erhalten eine eigene Contributions-Tabelle; optionaler Link in `transactions`.
- Alle Betragsfelder bleiben `amount_cents` + `currency`.

## Offene Fragen fuer naechste Iteration

- Soll `transaction_id` in `goal_contributions` verpflichtend werden (einheitliche Timeline)?
- Brauchen wir fuer Budgets eigene Perioden-Instanzen (z. B. `budget_periods`)?
- Wollen wir Goal-Status automatisch berechnen (target erreicht) oder explizit speichern?

