# Datenmodell: User Settings, Levels, XP, Streaks

Ziel: Einstellungen, Gamification und Streak-Tracking sauber und MVP-tauglich modellieren.

## Scope

- Sprache (de/en)
- Theme (system/light/dark)
- Notification Preferences (daily reminder, weekly report, monthly reminder)
- Level-System + XP
- Daily Login Streak

## Entitaeten (Vorschlag)

1) user_settings
2) levels (Lookup)
3) user_progress (XP + Streak)
4) xp_events (Audit / Debugging)

## Data Dictionary (Kurzform)

### user_settings
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id, UNIQUE | 1:1 |
| language | enum | NOT NULL | de/en |
| theme | enum | NOT NULL | system/light/dark |
| daily_reminder_enabled | boolean | NOT NULL, DEFAULT false | |
| weekly_report_enabled | boolean | NOT NULL, DEFAULT false | |
| monthly_reminder_enabled | boolean | NOT NULL, DEFAULT false | |
| timezone | text | NULLABLE | optional (z. B. Europe/Vienna) |
| reminder_time | time | NULLABLE | optional |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### levels
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| level_number | integer | UNIQUE | 1..N |
| name | text | NOT NULL | |
| emoji | text | NOT NULL | |
| xp_required | integer | NOT NULL | XP-Schwelle |

### user_progress
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id, UNIQUE | 1:1 |
| xp_total | integer | NOT NULL, DEFAULT 0 | |
| current_level_id | uuid | FK -> levels.id | optional, kann berechnet werden |
| current_streak | integer | NOT NULL, DEFAULT 0 | |
| longest_streak | integer | NOT NULL, DEFAULT 0 | |
| last_login_at | timestamptz | NULLABLE | |
| last_streak_date | date | NULLABLE | Datum des letzten Streak-Updates |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### xp_events
| Feld | Typ | Constraints | Notiz |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK -> users.id | |
| event_type | text | NOT NULL | z. B. daily_login, snap_created |
| xp_delta | integer | NOT NULL | positive/negative |
| source_type | text | NULLABLE | optional |
| source_id | uuid | NULLABLE | optional |
| meta | jsonb | NULLABLE | optional |
| created_at | timestamptz | NOT NULL | |

## Level-Definition (Seed)

- Level 1: Sparfuchs 🦊 – 0 XP
- Level 2: Aktiv ✨ – 500 XP
- Level 3: Pro 💎 – 1.500 XP
- Level 4: Elite 🛡️ – 3.500 XP
- Level 5: Icon 👑 – 7.500 XP

## XP-Events (MVP)

- Eintrag erstellen (Snap): +25 XP
- Erster Snap (Tutorial): +100 XP
- Täglicher Login: +5 XP
- 7-Tage-Streak Bonus: +150 XP
- Sparziel erreicht: +200 XP
- Payday Check (1. des Monats): Double XP auf Snaps

## Streak-Logik (Empfehlung)

- Beim Login:
  - Wenn `last_streak_date` = heute: nichts aendern.
  - Wenn `last_streak_date` = gestern: `current_streak += 1`.
  - Sonst: `current_streak = 1`.
  - `longest_streak = max(longest_streak, current_streak)`.
  - `last_login_at = now()`, `last_streak_date = today`.

