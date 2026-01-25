# Datenmodell: Onboarding

Ziel: Kanonisches Datenmodell fuer alle Onboarding-Eingaben als Basis fuer die spaetere Gesamt-DB-Struktur.

## Scope und Quellen

Quellen im Code:
- `client/screens/WelcomeScreen.tsx`
- `client/screens/SignUpScreen.tsx`
- `client/screens/OnboardingCurrencyScreen.tsx`
- `client/screens/Onboarding1Screen.tsx`
- `client/screens/Onboarding2Screen.tsx`
- `client/screens/Onboarding3Screen.tsx`
- `client/screens/Onboarding4Screen.tsx`
- `client/screens/Onboarding5Screen.tsx`
- `client/screens/Onboarding6Screen.tsx`
- `client/screens/Onboarding7Screen.tsx`
- `client/constants/budgetCategories.ts`
- `client/context/AppContext.tsx`

Vorgegebene Basis-Tabellen (fix):
- `public.users` (FK auf `auth.users`)
- `public.roles`
- `public.user_roles`
- Trigger-Funktion erstellt/aktualisiert `public.users` und weist Rolle `client` zu
- `has_role(role_name text)` fuer RLS-Pruefungen

## Eingaben im Onboarding (fachlich)

- Motivation(en) / Gruende (Multi-Select)
- Standardwaehrung (EUR/USD/CHF)
- Start-Ruecklage (Initial Savings)
- Sparziele (Name, Zielbetrag, monatlicher Beitrag, Icon) -> mehrere moeglich
- Einkommen (mehrere Quellen, monatlich)
- Fixkosten (mehrere Eintraege, monatlich)
- Budgets (Kategorie + monatliches Limit)

Nicht persistieren (ableiten):
- Spielraum (Onboarding6), Summen, Rates

## Entitaeten und Beziehungen (Vorschlag)

1) users (fix)
2) user_onboarding (Status + Version)
3) motivation_types (Lookup)
4) user_motivations (Join)
5) user_financial_profiles (Initial Savings, Default Currency)
6) savings_goals
7) income_sources
8) fixed_expenses
9) budget_categories (Lookup)
10) budgets
11) currencies (Lookup, optional aber empfohlen)

Beziehungen (Kurzform):
- users 1:1 user_onboarding
- users 1:N user_motivations -> motivation_types
- users 1:1 user_financial_profiles
- users 1:N savings_goals
- users 1:N income_sources
- users 1:N fixed_expenses
- users 1:N budgets -> budget_categories
- currencies 1:N zu allen Geld-Tabellen (via currency_code)

## Data Dictionary (Kurzform)

### users
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK, FK -> auth.users.id | wird ueber Trigger angelegt |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| name | text | NULLABLE | aus Provider-Meta |
| updated_at | timestamptz | NULLABLE | |
| status | text | NULLABLE, DEFAULT 'Aktiv' | |
| avatar | jsonb | NULLABLE | { url, provider } |

### user_onboarding
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id, UNIQUE | 1:1 |
| onboarding_version | text | NOT NULL | UI/Flow Version |
| started_at | timestamptz | NOT NULL | |
| completed_at | timestamptz | NULLABLE | |
| skipped_steps | jsonb | NULLABLE | z. B. ["Onboarding2"] |

### motivation_types
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| key | text | UNIQUE, NOT NULL | stabile ID (slug) |
| label | text | NOT NULL | Anzeige im UI |
| active | boolean | NOT NULL, DEFAULT true | |

### user_motivations
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| motivation_id | uuid | FK -> motivation_types.id | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| UNIQUE(user_id, motivation_id) | | | keine Duplikate |

### user_financial_profiles
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id, UNIQUE | 1:1 |
| initial_savings_cents | integer | NOT NULL, DEFAULT 0 | Onboarding2 |
| currency | char(3) | NOT NULL, DEFAULT 'EUR' | ISO 4217, CHECK in (EUR, USD, CHF) |
| as_of_date | date | NULLABLE | Stichtag |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

### savings_goals
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| name | text | NOT NULL | Onboarding3 |
| icon | text | NULLABLE | Emoji/Icon |
| target_amount_cents | integer | NOT NULL, CHECK >= 0 | |
| monthly_contribution_cents | integer | NULLABLE | Onboarding3 (aktuell nicht gespeichert) |
| created_in_onboarding | boolean | NOT NULL, DEFAULT false | |
| status | text | NOT NULL, DEFAULT 'active' | z. B. active/paused/reached |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

### income_sources
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| name | text | NOT NULL | z. B. "Gehalt" |
| amount_cents | integer | NOT NULL, CHECK >= 0 | |
| frequency | text | NOT NULL | default: monthly |
| currency | char(3) | NOT NULL, DEFAULT 'EUR' | CHECK in (EUR, USD, CHF) |
| start_date | date | NULLABLE | |
| end_date | date | NULLABLE | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

### fixed_expenses
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| name | text | NOT NULL | z. B. "Miete" |
| amount_cents | integer | NOT NULL, CHECK >= 0 | |
| frequency | text | NOT NULL | default: monthly |
| currency | char(3) | NOT NULL, DEFAULT 'EUR' | CHECK in (EUR, USD, CHF) |
| start_date | date | NULLABLE | |
| end_date | date | NULLABLE | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

### budget_categories
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| key | text | UNIQUE, NOT NULL | slug | 
| name | text | NOT NULL | Anzeige im UI |
| icon | text | NULLABLE | Feather Icon Name |
| color | text | NULLABLE | Hex |
| active | boolean | NOT NULL, DEFAULT true | |

### budgets
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| category_id | uuid | FK -> budget_categories.id | |
| limit_amount_cents | integer | NOT NULL, CHECK >= 0 | Onboarding7 |
| period | text | NOT NULL | default: monthly |
| currency | char(3) | NOT NULL, DEFAULT 'EUR' | CHECK in (EUR, USD, CHF) |
| start_date | date | NULLABLE | |
| is_active | boolean | NOT NULL, DEFAULT true | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

## SSOT vs. abgeleitete Werte

SSOT (persistieren):
- alle Tabellen oben

Ableiten (nicht persistieren):
- Spielraum (income - fixed_expenses)
- Budgetsummen, Gesamtincome, Savings Rate

## Entscheidungen (Kurz)

- Income und Fixed Expenses separat modellieren (statt generischer Recurring Items), da UI dies trennt.
- Initial Savings als Financial Profile (1:1) speichern; spaeter erweiterbar (z. B. Accounts).
- Budget Categories als Lookup-Tabelle, damit UI/DB konsistent bleiben.
- Mehrere Sparziele im Onboarding moeglich.
- Frequenzen aktuell nur monthly (UI impliziert monatlich); CHECK auf 'monthly'.
- Budget-Kategorien sind fixe Lookup-Liste.

## Offene Fragen fuer naechste Iteration

- Wollen wir spaeter Multi-Currency pro Eintrag (mixed currencies) oder pro User eine feste Default-Waehrung?

## Currency-Strategie (Best Practice)

Empfohlen (schlank, zukunftssicher):
- Geldwerte immer als `amount_cents` + `currency` speichern (ISO 4217).
- `currency` als CHECK auf (EUR, USD, CHF) oder als FK zu `currencies` (Lookup).
- Falls Summen ueber mehrere Waehrungen benoetigt werden: FX-Rate-Snapshots speichern (z. B. `fx_rates` mit `base_currency`, `quote_currency`, `rate`, `as_of_date`, `source`).
- Aggregationen nie ohne definierte Umrechnung (sonst inkonsistent).

MVP-Empfehlung:
- Pro User eine Default-Waehrung (EUR/USD/CHF) im `user_financial_profiles`.
- Alle Geld-Tabellen muessen diese Default-Waehrung verwenden (Constraint/Validation).
- Keine FX-Tabellen im MVP; Umrechnung erst spaeter einfuehren.
