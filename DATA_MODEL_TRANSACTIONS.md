# Datenmodell: Phase 2 – Einnahmen/Ausgaben & Transaktionen

Ziel: Kanonisches Modell fuer variable Einnahmen/Ausgaben (Transaktionen) und die Uebersichten/Insights.

## Scope und Quellen

Quellen im Code:
- `client/screens/HomeScreen.tsx`
- `client/screens/AddScreen.tsx`
- `client/screens/InsightsScreen.tsx`
- `client/screens/IncomeScreen.tsx`
- `client/screens/ExpensesScreen.tsx`
- `client/context/AppContext.tsx`
- `client/constants/budgetCategories.ts`

## Ist-Logik (kurz)

- Variable Ausgaben werden ueber `AddScreen` als Transaktionen gespeichert.
- Variable Ausgaben koennen automatisch einem Budget zugeordnet werden (`addExpenseWithAutobudget`).
- Income/Expense Screens verwalten **fixe** monatliche Eintraege (recurring) getrennt von Transaktionen.
- Insights nutzt Budgets + Budget-Expenses fuer Kategorien-Analysen; Trends sind aktuell abgeleitet.

## Entitaeten und Beziehungen (Vorschlag)

1) transactions (SSOT fuer variable Einnahmen/Ausgaben)
2) income_categories (Lookup, optional aber empfohlen)
3) budget_categories (bereits definiert, fuer expense categories)
4) budgets (bereits definiert; transactions koennen an budgets gebunden sein)

Beziehungen (Kurzform):
- users 1:N transactions
- budget_categories 1:N transactions (nur fuer expense)
- income_categories 1:N transactions (nur fuer income)
- budgets 1:N transactions (nur fuer expense)

## Data Dictionary (Kurzform)

### transactions
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| type | text | NOT NULL | CHECK in ('income', 'expense') |
| amount_cents | integer | NOT NULL, CHECK >= 0 | Betrag immer positiv; Typ bestimmt Vorzeichen |
| currency | char(3) | NOT NULL | CHECK in (EUR, USD, CHF) |
| name | text | NOT NULL | Beschreibung/Label |
| category_name | text | NULLABLE | Snapshot/Fallback fuer historische Anzeige |
| income_category_id | uuid | FK -> income_categories.id, NULLABLE | nur fuer income |
| budget_category_id | uuid | FK -> budget_categories.id, NULLABLE | nur fuer expense |
| budget_id | uuid | FK -> budgets.id, NULLABLE | optional (MVP), nicht verpflichtend |
| transaction_at | timestamptz | NOT NULL | Zeitpunkt der Transaktion |
| source | text | NOT NULL, DEFAULT 'manual' | z. B. manual/autobudget/onboarding |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

Indizes (empfohlen):
- (user_id, transaction_at)
- (user_id, type)
- (budget_id)
- (budget_category_id)

### income_categories (Lookup)
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| key | text | UNIQUE, NOT NULL | slug (gehalt, freelance, ...)
| name | text | NOT NULL | Anzeige |
| icon | text | NULLABLE | Feather icon name |
| active | boolean | NOT NULL, DEFAULT true | |

## SSOT vs. abgeleitete Werte

SSOT (persistieren):
- transactions (alle variablen Einnahmen/Ausgaben)

Ableiten (nicht persistieren):
- Wochen- und Monats-Statistiken
- Insights (Donut/Trend)
- Summen (income/expense/balance)

## Entscheidungen (Kurz)

- Transaktionen als einzige Quelle fuer variable Einnahmen/Ausgaben.
- Betrag immer positiv speichern; Typ definiert Vorzeichen (vermeidet negative Summenfehler).
- Expense-Kategorien koennen direkt `budget_categories` nutzen; Income-Kategorien als Lookup.
- Kategorien sind Lookup, um konsistente Icons/Labels zu erzwingen.
- `category_name` als Snapshot beibehalten (Audit/History, falls Lookups spaeter umbenannt werden).
- `budget_id` optional, damit Ausgaben auch ohne angelegte Budgets moeglich sind.

## Mapping zum aktuellen UI

- `AddScreen` (Ausgaben): erstellt Transaction (type='expense'), setzt `budget_id`/`budget_category_id`.
- `AddScreen` (Einnahmen): erstellt Transaction (type='income'), setzt `income_category_id`.
- `HomeScreen`: nutzt Transaktionen fuer "Letzte Transaktionen" und Wochenausgaben.
- `Insights`: aggregiert Transaktionen nach Kategorien und Zeitraeumen.

## Offene Fragen fuer naechste Iteration

- Soll ein Constraint erzwungen werden, dass bei `expense` mindestens `budget_category_id` oder `category_name` gesetzt ist?
- Brauchen wir eine `merchant`/`notes` Spalte fuer feinere Analysen?
