# Push Notification Reminders Plan

Ziel: Die Reminder-Anforderungen als umsetzbaren Plan fuer App, Backend und Datenbank strukturieren.

Wichtige Vorgabe:

- Alle Reminder werden als Push-Benachrichtigungen umgesetzt.
- Uebersetzungen werden fuer die erste Umsetzungsphase vernachlaessigt, muessen aber spaeter sauber nachgezogen werden.

## Scope

Folgende Push-Reminder sind aktuell im Scope:

- 1st of the Month Reminder
- Trial Ending Push Notification
- Weekly Wrap-Up
- Daily Habit Reminder

Nicht im Scope fuer Phase 1:

- Vollstaendige i18n-Integration der Notification-Texte
- Feintuning der finalen Copy
- Experiment-/A/B-Testing fuer unterschiedliche Texte

## Zielbild

Die App speichert Push-Praeferenzen, Zeitzone und Push-Token pro User. Die Datenbank ist die Single Source of Truth fuer Reminder-Konfiguration, Versandstatus und Audit-Trails. Ein serverseitiger Scheduler oder Worker ermittelt faellige Notifications und versendet Push-Benachrichtigungen ueber den gewaehlten Push-Provider. Beim Antippen der Benachrichtigung wird der passende Deep Link in der App geoeffnet.

## Security Guardrails

Die Push-Architektur soll strikt serverseitig autoritativ bleiben.

- Der Client darf nur diese Daten schreiben oder anstossen:
  - eigene Notification-Praeferenzen
  - eigene Zeitzone
  - eigene Push-Tokens
  - lokale Permission-Abfrage und Deep-Link-Oeffnung
- Der Client darf niemals:
  - Pushes direkt an den Provider senden
  - Versandjobs erzeugen, umplanen oder als `sent` markieren
  - andere User-Tokens oder globale Kampagnen lesen
  - Service-Role-Keys, Provider-Secrets oder Scheduling-Logik kennen
- Selektion, Personalisierung und Versand laufen serverseitig:
  - Ermittlung faelliger User
  - Berechnung von Summen, Trial-Ende und Versandzeitpunkten
  - Aufbau der finalen Notification-Payload
  - Versand an den Push-Provider
  - Retry- und Invalid-Token-Handling
- Push-Inhalte muessen datensparsam bleiben:
  - keine Rohdatenlisten oder sensiblen Finanzdetails in die Push-Message schreiben
  - im Weekly Wrap-Up nur aggregierte Werte verwenden
  - keine internen IDs, Secrets oder Debug-Infos im Payload exponieren
- Tabellenzugriff absichern:
  - `push_tokens` nur fuer den eigenen User schreibbar/lesbar machen, falls Client-Lesezugriff ueberhaupt noetig ist
  - `notification_jobs` und `notification_deliveries` nicht direkt fuer den Client freigeben
  - `notification_campaigns` nur serverseitig oder read-only, falls wirklich im Client benoetigt
- Secrets bleiben ausschliesslich serverseitig:
  - Push-Provider-Credentials nur in Supabase Secrets oder Server-Env
  - kein Secret, kein Admin-Key und keine Provider-Response-Interna im Client

## Offene Produkt- und Technikentscheidungen

Diese Punkte muessen vor der Implementierung final bestaetigt werden:

- Welcher Push-Stack wird verwendet: `expo-notifications` liegt aktuell nicht im Projekt und darf nicht ohne Abstimmung eingefuehrt werden.
- Ob der Versand direkt ueber Expo Push Service oder ueber einen anderen Provider laufen soll.
- Ob User globale Push-Opt-ins und Reminder-spezifische Opt-ins getrennt steuern sollen.
- Ob der Weekly Wrap-Up nur verschickt wird, wenn im relevanten Zeitraum Transaktionen vorhanden sind.
- Welche exakte Logik fuer Trial-Ende gilt, falls Trial bereits beendet oder Upgrade bereits erfolgt ist.

## Reminder-Matrix

| Reminder                       | Trigger                                    | Personalisierung                        | Ziel in der App                   |
| ------------------------------ | ------------------------------------------ | --------------------------------------- | --------------------------------- |
| 1st of the Month Reminder      | Monatlich am 1. Tag zu definierter Uhrzeit | optional Name, optional XP-Kampagne     | Home oder Budget/Fixkosten Screen |
| Trial Ending Push Notification | 3 Tage vor Trial-Ende                      | XP-Wert, Trial-Enddatum                 | Paywall-/Upgrade-Screen           |
| Weekly Wrap-Up                 | Woechentlich, aktuell montags              | Summe der Top-Ausgaben / Wochenausgaben | Insights-/Analytics-Screen        |
| Daily Habit Reminder           | Taeglich zu definierter Uhrzeit            | optional personalisierte Ansprache      | Add-Transaction / Home Screen     |

## Datenmodell

### 1. Erweiterung bestehender User Settings

Bestehendes Modell aus `docs/DATA_MODEL_SETTINGS_LEVELS.md` sollte fuer Push-Notifications erweitert und praezisiert werden.

Empfohlene Felder in `user_settings`:

- `push_notifications_enabled boolean not null default false`
- `daily_reminder_enabled boolean not null default false`
- `weekly_report_enabled boolean not null default false`
- `monthly_reminder_enabled boolean not null default false`
- `trial_ending_push_enabled boolean not null default true`
- `timezone text null`
- `reminder_time time null`
- `weekly_report_day smallint null`
- `monthly_reminder_day smallint null default 1`
- `updated_at timestamptz not null`

Hinweise:

- `timezone` ist Pflicht fuer sauberes Scheduling pro User.
- `reminder_time` sollte fuer Daily und optional Monthly wiederverwendet werden, falls keine reminder-spezifischen Zeiten benoetigt werden.
- Falls Weekly und Monthly eigene Uhrzeiten benoetigen, lieber eigene Felder einfuehren statt impliziter Sonderlogik.
- Der Client darf nur die eigene Settings-Zeile lesen und aktualisieren.

### 2. Neue Tabelle `push_tokens`

Zweck: Ein User kann mehrere Geraete haben. Push-Tokens gehoeren nicht in `user_settings`.

Vorschlag:

| Feld         | Typ         | Constraints             | Notiz                  |
| ------------ | ----------- | ----------------------- | ---------------------- |
| id           | uuid        | PK                      |                        |
| user_id      | uuid        | FK -> users.id not null |                        |
| provider     | text        | not null                | z. B. expo             |
| token        | text        | not null unique         | Push token             |
| platform     | text        | not null                | ios/android            |
| device_id    | text        | null                    | app-defined identifier |
| app_build    | text        | null                    | Debug/Audit            |
| is_active    | boolean     | not null default true   |                        |
| last_seen_at | timestamptz | not null                |                        |
| created_at   | timestamptz | not null                |                        |
| updated_at   | timestamptz | not null                |                        |

Empfohlene Indizes:

- `index push_tokens_user_id_idx on user_id`
- Partial index auf aktive Tokens

Security:

- Tokens sind sensitiv und duerfen nie offen zwischen Usern lesbar sein.
- Der Client darf maximal eigene Tokens registrieren oder deaktivieren.
- Versand darf nie direkt aus dem Client mit Token-Listen erfolgen.

### 3. Neue Tabelle `notification_campaigns`

Zweck: Zentrale Definition der Reminder-Typen und ihrer Versandlogik.

Vorschlag:

| Feld              | Typ         | Constraints           | Notiz                                                            |
| ----------------- | ----------- | --------------------- | ---------------------------------------------------------------- |
| id                | uuid        | PK                    |                                                                  |
| key               | text        | unique not null       | `daily_habit`, `weekly_wrap_up`, `monthly_check`, `trial_ending` |
| channel           | text        | not null              | fuer jetzt immer `push`                                          |
| is_enabled        | boolean     | not null default true | global toggle                                                    |
| default_title_key | text        | null                  | spaeter fuer i18n                                                |
| default_body_key  | text        | null                  | spaeter fuer i18n                                                |
| created_at        | timestamptz | not null              |                                                                  |
| updated_at        | timestamptz | not null              |                                                                  |

### 4. Neue Tabelle `notification_jobs`

Zweck: Geplante und bereits verarbeitete Versandjobs pro User.

Vorschlag:

| Feld          | Typ         | Constraints                              | Notiz                                                  |
| ------------- | ----------- | ---------------------------------------- | ------------------------------------------------------ |
| id            | uuid        | PK                                       |                                                        |
| user_id       | uuid        | FK -> users.id not null                  |                                                        |
| campaign_id   | uuid        | FK -> notification_campaigns.id not null |                                                        |
| scheduled_for | timestamptz | not null                                 | UTC                                                    |
| status        | text        | not null                                 | `pending`, `processing`, `sent`, `failed`, `cancelled` |
| dedupe_key    | text        | not null unique                          | verhindert Doppelversand                               |
| payload       | jsonb       | null                                     | title, body, deeplink, meta                            |
| error_message | text        | null                                     | letzter Fehler                                         |
| sent_at       | timestamptz | null                                     |                                                        |
| created_at    | timestamptz | not null                                 |                                                        |
| updated_at    | timestamptz | not null                                 |                                                        |

Empfohlene Indizes:

- `(status, scheduled_for)`
- `(user_id, campaign_id)`

Security:

- Diese Tabelle sollte server-only sein.
- Der Client darf keine Rohjobs lesen oder manipulieren.
- `payload` darf keine sensiblen Rohdaten enthalten, nur noetige Push-Inhalte und Deep-Link-Metadaten.

### 5. Optionale Tabelle `notification_deliveries`

Zweck: Audit pro Token und Provider-Response.

Nur noetig, wenn ihr Versandfehler, Retries und Token-Invalidierung sauber nachvollziehen wollt.

Vorschlag:

- Referenz auf `notification_jobs`
- Referenz auf `push_tokens`
- Provider Response ID
- Status pro Token
- Fehlercode / Fehlermeldung

## Architektur

## Client

Verantwortung:

- Push-Berechtigung anfragen
- Push-Token registrieren
- Token bei Login/App-Start ans Backend synchronisieren
- Notification-Praeferenzen im Settings-Screen pflegen
- Notification-Praeferenzen auf dem Profile-Screen integrieren und pflegen
- Notification Tap auf Deep Link aufloesen

Nicht im Client:

- keine Versandentscheidung
- keine Empfaenger-Selektion
- keine Trial-Ende-Berechnung
- keine Weekly-Ausgabenberechnung fuer Versandzwecke
- keine Provider-Credentials

Client-Bausteine:

- Settings UI fuer Reminder-Opt-ins
- Bereich auf dem `ProfileScreen` fuer Notification-Einstellungen
- Hook oder Service fuer Permission Flow
- Service fuer Registrierung und Deaktivierung von Push-Tokens
- Deep-Link-Handling fuer Notification-Ziele

## Profile-Screen Integration

Die Notification-Einstellungen sollen auf dem bestehenden `ProfileScreen` integriert werden.

Ist-Zustand im Code:

- In [client/screens/ProfileScreen.tsx](/Users/dennisschaible/Desktop/Coding/luke/client/screens/ProfileScreen.tsx) existiert bereits eine Section `Benachrichtigungen`.
- Diese Section rendert aktuell drei statische `SettingsRow`-Toggles mit festem `false`.
- `Trial Ending Push Notification` fehlt dort aktuell komplett.
- In der Section `Präferenzen` gibt es derzeit zusaetzlich noch einen separaten Eintrag `Monatlicher Reminder`, der bei der Umsetzung konsolidiert werden sollte.
- Mit [client/components/SettingsRow.tsx](/Users/dennisschaible/Desktop/Coding/luke/client/components/SettingsRow.tsx) existiert bereits der passende UI-Baustein fuer Toggle-, Text- und Button-Zeilen.

Geplanter Umfang auf dem Profile-Screen:

- globaler Toggle fuer Push-Benachrichtigungen
- einzelne Toggle-Felder fuer:
  - Daily Habit Reminder
  - Weekly Wrap-Up
  - 1st of the Month Reminder
  - Trial Ending Push Notification
- Anzeige des aktuellen Permission-Status
- CTA oder Hinweis, falls OS-Permission deaktiviert ist
- optional Auswahl oder Anzeige der Reminder-Zeit
- Speichern ueber bestehende serverseitige Settings-Anbindung

Konkrete Umsetzung im bestehenden `ProfileScreen`:

- Die vorhandene `Benachrichtigungen`-Section bleibt der zentrale Einstiegspunkt.
- Die vorhandenen `SettingsRow`-Eintraege werden an echte Settings-Werte gebunden.
- Zusaetzlich kommen hinzu:
  - ein oberster Master-Toggle `Push-Benachrichtigungen`
  - ein neuer Toggle `Trial-Ende Erinnerung`
  - eine Status-Zeile `Mitteilungen im Betriebssystem` mit Text oder Button-Aktion
  - optional eine Zeile `Reminder-Zeit`
- Der doppelte `Monatlicher Reminder` in `Präferenzen` wird bei der Implementierung entfernt oder in die Notification-Section verschoben.
- Die Reihenfolge auf dem Screen sollte sein:
  1. Master-Toggle
  2. Daily Habit Reminder
  3. Weekly Wrap-Up
  4. 1st of the Month Reminder
  5. Trial Ending Push Notification
  6. Permission-Status / CTA
  7. optional Reminder-Zeit

Konkrete Datenanbindung fuer den `ProfileScreen`:

- Laden der Werte beim Screen-Entry ueber serverseitigen Settings-Read
- Schreiben pro Toggle-Aenderung oder gesammelt ueber serverseitigen Settings-Write
- Permission-Status lokal vom OS lesen, aber nicht als Versandquelle verwenden
- Push-Token-Registrierung nach erfolgreicher Permission serverseitig synchronisieren

Routing-Empfehlung basierend auf vorhandenen Screens:

- Daily Habit Reminder: `Main -> Home`
- Weekly Wrap-Up: `Main -> Insights`
- 1st of the Month Reminder: `Main -> Home`
- Trial Ending Push Notification: `Paywall`

Security fuer den Profile-Screen:

- Der Screen darf nur die eigenen Notification-Settings lesen und schreiben.
- Der Screen darf keine Versandhistorie, fremde Tokens oder Rohjobs anzeigen.
- Der Screen darf keine Provider- oder Scheduler-Informationen enthalten.
- Aenderungen am Profile-Screen duerfen nur User-Praeferenzen aktualisieren, nicht aber Jobs erzeugen oder versenden.

## Backend / Supabase

Verantwortung:

- Tokens speichern und deaktivieren
- Faellige Jobs erzeugen
- Jobs versenden
- Fehlerfaelle und Retries behandeln
- Fachliche Trigger wie Trial-Ende oder Weekly-Auswertung berechnen

Moegliche Bausteine:

- RPCs oder normale Tabellenzugriffe fuer User Settings
- Supabase Edge Function fuer Token-Registration
- Supabase Edge Function oder Cron-Worker fuer Job-Erzeugung
- Supabase Edge Function oder Cron-Worker fuer Versand

Security-Vorgabe:

- Bevorzugt serverseitige RPCs oder Edge Functions statt direkter kritischer `.from(...)`-Mutationen aus dem Client.
- Versand-Worker laeuft mit serverseitigen Secrets.
- RLS darf Client-Zugriffe auf Job-/Delivery-Tabellen blockieren.

## Versandfluss

1. App fragt Permission an und registriert Push-Token.
2. Token wird serverseitig mit User und Plattform gespeichert.
3. Scheduler erzeugt `notification_jobs` fuer alle faelligen User.
4. Versand-Worker laedt `pending` Jobs und versendet Pushes.
5. Erfolgreiche Jobs werden auf `sent` gesetzt.
6. Ungueltige Tokens werden deaktiviert.
7. Tap auf Push oeffnet den passenden Deep Link in der App.

## Phasenplan

## Phase 0: Konzept und technische Entscheidung

Ziel: Offene Entscheidungen schliessen und die Architektur festziehen.

Ergebnis Phase 0:

- Push-Reminder werden auf dem bestehenden `ProfileScreen` integriert, nicht auf einem separaten Settings-Screen.
- Der bestehende Expo-Stack ist die Basis; fuer die Implementierung wird `expo-notifications` als passender Push-Client eingeplant.
- Versandkanal ist Push ueber einen serverseitigen Versandpfad.
- Scheduling, Dedupe, Personalisierung und Versand laufen serverseitig.
- Der Client bleibt auf Permission, Token-Sync, Settings-Pflege und Deep-Link-Oeffnung begrenzt.
- Weekly Wrap-Up verschickt nur aggregierte Werte.
- Trial-Reminder wird nur aus serverseitigem Access-/Trial-State abgeleitet.

Entscheidungen:

- Push-Stack:
  - Entscheidung: Expo-basierter Push-Flow mit `expo-notifications` im Client und serverseitigem Versand ueber Expo Push Service.
  - Begruendung: Das Projekt basiert bereits auf Expo, dadurch ist der Integrationspfad konsistent und risikoaermer als ein paralleler nativer Push-Stack.
- Einstiegsort in der App:
  - Entscheidung: Notification-Einstellungen werden in die vorhandene `Benachrichtigungen`-Section des `ProfileScreen` integriert.
  - Begruendung: Die Section existiert bereits und reduziert zusaetzliche Navigations- und UI-Komplexitaet.
- Deep Links:
  - Entscheidung: Daily und Monthly oeffnen `Main -> Home`, Weekly oeffnet `Main -> Insights`, Trial oeffnet `Paywall`.
  - Begruendung: Diese Screens existieren bereits und decken den fachlichen Zielkontext direkt ab.
- Versandmodell:
  - Entscheidung: Der Client registriert nur Token und Praeferenzen; Jobs werden ausschliesslich serverseitig erzeugt und versendet.
  - Begruendung: Das entspricht der bereits eingeschlagenen server-authoritative Sicherheitsrichtung im Projekt.
- Datenschutz der Push-Inhalte:
  - Entscheidung: Pushes enthalten nur knappe Reminder- oder aggregierte Summenhinweise, keine Einzeltransaktionen, keine Bankdaten und keine Provider-Interna.
  - Begruendung: Reduziert Leak-Risiko auf Lockscreen und in Provider-Payloads.

TODOs Produkt:

- [x] Trigger-Logik pro Reminder final bestaetigen.
- [x] Ziel-Screens und Deep Links pro Reminder definieren.
- [x] Definieren, welche Reminder default-on oder default-off sind.
- [x] Uebersetzungen explizit als spaetere Phase markieren.
- [x] Festlegen, wie die Notification-Einstellungen auf dem `ProfileScreen` gruppiert und benannt werden.

TODOs Technik:

- [x] Push-Provider festlegen.
- [x] Klaeren, ob Expo Push verwendet werden soll.
- [x] Retry-Strategie und Fehlerbehandlung definieren.
- [x] Entscheiden, ob Jobs vorab geplant oder just-in-time erzeugt werden.
- [x] Festlegen, dass Versand und Scheduling ausschliesslich serverseitig laufen.
- [x] Festlegen, dass keine Provider-Secrets oder Versandendpunkte im Client verwendet werden.

Phase-0 Defaults fuer die Umsetzung:

- `push_notifications_enabled`: default `false`
- `daily_reminder_enabled`: default `false`
- `weekly_report_enabled`: default `false`
- `monthly_reminder_enabled`: default `false`
- `trial_ending_push_enabled`: default `true`
- `weekly_report_day`: Montag
- `monthly_reminder_day`: 1
- `reminder_time`: initial aus Geraetezeit oder fallback auf einen festen Standard bei spaeterer Implementierung

Retry- und Fehlerstrategie:

- temporaere Provider-Fehler fuehren zu Retry ueber den serverseitigen Worker
- ungueltige Tokens werden serverseitig deaktiviert
- Versandjobs bleiben idempotent ueber `dedupe_key`
- keine clientseitigen Retry-Schleifen fuer den Versand

Abnahme fuer Phase 0:

- Finales Architekturdiagramm
- Finales Datenmodell
- Provider-Entscheidung dokumentiert

## Phase 1: Datenbank-Grundlage

Ziel: Persistenz, Audit und Scheduling-faehige Strukturen schaffen.

TODOs Datenbank:

- [x] Migration fuer Erweiterung von `user_settings` erstellen.
- [x] Migration fuer `push_tokens` erstellen.
- [x] Migration fuer `notification_campaigns` erstellen.
- [x] Migration fuer `notification_jobs` erstellen.
- [x] Optional `notification_deliveries` anlegen, falls Audit pro Token benoetigt wird.
- [x] Constraints, Defaults und Indizes definieren.
- [x] RLS-Regeln fuer `push_tokens` und Settings sauber definieren.
- [x] Client-Zugriff auf `notification_jobs` und `notification_deliveries` per RLS blockieren.
- [x] Seeds fuer Kampagnen `daily_habit`, `weekly_wrap_up`, `monthly_check`, `trial_ending` anlegen.

TODOs Server:

- [x] Typen und Mapper fuer neue Tabellen ergaenzen.
- [x] Lesende/schreibende API-Flaechen fuer Settings und Push-Tokens definieren.
- [x] Serverseitige API fuer Token-Registration definieren.
- [x] Serverseitige API fuer eigene Notification-Praeferenzen definieren.

Abnahme fuer Phase 1:

- Alle Migrationen laufen sauber
- Tabellen und Constraints sind dokumentiert
- Client kann Settings und Tokens speichern

## Phase 2: Client-Integration fuer Push

Ziel: Die App kann Push-Berechtigungen und Tokens sauber verwalten.

TODOs Client:

- [x] Notification-Service im Client anlegen.
- [x] Permission Flow fuer iOS und Android implementieren.
- [x] Push-Token abrufen und an Backend senden.
- [x] Token-Refresh und Logout-Deaktivierung beruecksichtigen.
- [x] `ProfileScreen` um Push-Opt-ins erweitern.
- [x] Notification-Bereich auf dem `ProfileScreen` visuell und inhaltlich sauber integrieren.
- [x] Zeitzone des Geraets ermitteln und mitspeichern.
- [x] Deep-Link-Routing fuer Notification-Taps implementieren.
- [x] Sicherstellen, dass der Client keine Versand- oder Scheduler-Logik enthaelt.

TODOs Qualitaet:

- [x] Fehlerfall ohne Berechtigung sauber behandeln.
- [x] UI fuer deaktivierte Berechtigung im OS vorsehen.
- [x] Loading- und Error-States fuer Settings absichern.
- [x] Sicherstellen, dass keine sensiblen Push- oder Jobdaten im Client-State persistiert werden.
- [x] Sicherstellen, dass der `ProfileScreen` auch ohne erteilte Push-Permission stabil funktioniert.

Abnahme fuer Phase 2:

- User kann Push aktivieren/deaktivieren
- Token wird gespeichert
- Notification-Tap oeffnet den korrekten Screen

## Phase 3: Scheduling und Versand-Infrastruktur

Ziel: Serverseitig faellige Pushes erzeugen und versenden.

TODOs Backend:

- [x] Edge Function oder Worker fuer Job-Erzeugung implementieren.
- [x] Edge Function oder Worker fuer Versand implementieren.
- [x] Dedupe-Logik ueber `dedupe_key` erzwingen.
- [x] Invalid Token Handling implementieren.
- [x] Retry-Mechanismus fuer temporaere Fehler definieren.
- [x] Logging fuer Versandfehler und Provider-Responses ergaenzen.
- [x] Provider-Secrets ausschliesslich serverseitig halten.
- [x] Versand so kapseln, dass der Client keine direkten Provider-Calls ausfuehren kann.

TODOs Scheduling:

- [x] Daily Reminder pro User anhand `timezone` und `reminder_time` berechnen.
- [x] Weekly Wrap-Up pro User anhand Wochentag und Zeitzone berechnen.
- [x] Monthly Reminder fuer den 1. des Monats berechnen.
- [x] Trial-Ending Jobs aus Trial-Enddatum ableiten.
- [x] Sicherstellen, dass Scheduling nur serverseitig und idempotent laeuft.

Abnahme fuer Phase 3:

- Jobs werden serverseitig erzeugt
- Pending Jobs werden versendet
- Doppelversand wird verhindert

Offener Deploy-Schritt fuer Phase 3:

- Vault-Secrets `notification_dispatch_url` und `notification_dispatch_auth_header` muessen gesetzt sein, damit der Dispatcher-Cron automatisch feuert.
- Die Edge Function `notification-job-dispatcher` muss mit `NOTIFICATION_FUNCTION_AUTH_HEADER` und optional `EXPO_PUSH_ACCESS_TOKEN` deployed sein.

## Phase 4: Reminder-spezifische Fachlogik

Ziel: Jeder Reminder bekommt seine fachliche Datengrundlage.

### Daily Habit Reminder

TODOs:

- [ ] Opt-in aus `user_settings` pruefen.
- [ ] Nur senden, wenn globales Push-Opt-in aktiv ist.
- [ ] Deep Link auf Home oder Add-Transaction Flow setzen.
- [ ] Keine sensiblen Nutzungsdaten in den Push-Text uebernehmen.

### Weekly Wrap-Up

TODOs:

- [ ] Query fuer Wochenausgaben definieren.
- [ ] Regel definieren, was bei `0` Ausgaben passiert.
- [ ] Payload mit Ausgaben-Summe erzeugen.
- [ ] Deep Link auf Insights setzen.
- [ ] Nur aggregierte Werte pushen, keine Einzeltransaktionen oder Kategorienamen.

### 1st of the Month Reminder

TODOs:

- [ ] Monatlich am 1. Tag in User-Zeitzone schedulen.
- [ ] Optionalen Bezug zu Fixkosten/Budgets definieren.
- [ ] Optionalen XP-Hinweis aus Feature-Flags oder Kampagnenlogik beziehen.
- [ ] Keine sensiblen Budgetdetails in den Push-Text uebernehmen.

### Trial Ending Push Notification

TODOs:

- [ ] Trial-Enddatum aus vorhandener Subscription-/Access-Quelle ableiten.
- [ ] Nur User im relevanten Trial-Status selektieren.
- [ ] Upgrade-Link oder Paywall-Screen als Ziel setzen.
- [ ] Versand 3 Tage vor Trial-Ende deduplizieren.
- [ ] Keine billing-internen Providerdaten oder Statusdetails im Client exponieren.

Abnahme fuer Phase 4:

- Jeder Reminder hat definierte SQL-/Query-Logik
- Payload pro Reminder ist stabil und testbar

## Phase 5: Qualitaet, Tests und Rollout

Ziel: Stabiler Versand ohne Doppelungen, tote Tokens oder unklare Fehler.

TODOs Tests:

- [ ] Unit-Tests fuer Scheduling-Logik schreiben.
- [ ] Unit-Tests fuer Dedupe-Keys schreiben.
- [ ] Tests fuer Trial-Ende, Wochenwechsel und Monatswechsel schreiben.
- [ ] Tests fuer Timezone-Kantenfaelle schreiben.
- [ ] Tests fuer Token-Deaktivierung bei Provider-Fehlern schreiben.
- [ ] Tests fuer RLS und gesperrte Client-Zugriffe auf Job-/Delivery-Tabellen schreiben.

TODOs Betrieb:

- [ ] Monitoring fuer Versandrate, Fehlerquote und invalid tokens einfuehren.
- [ ] Admin- oder Debug-Query fuer offene/fehlgeschlagene Jobs vorbereiten.
- [ ] Kleinen internen Rollout mit Test-Usern planen.
- [ ] Danach graduellen Rollout fuer alle User vorsehen.
- [ ] Security-Review vor Rollout durchfuehren: Secrets, RLS, Client-Payloads, Logging.

Abnahme fuer Phase 5:

- Kernfluesse sind automatisiert getestet
- Monitoring und Debugging sind vorhanden
- Rollout-Plan ist dokumentiert

## Priorisierte Implementierungsreihenfolge

Empfohlene Reihenfolge fuer den ersten Delivery-Slice:

1. `user_settings` erweitern
2. `push_tokens` einfuehren
3. Client-Permission + Token-Registration bauen
4. `notification_campaigns` und `notification_jobs` einfuehren
5. Daily Habit Reminder end-to-end umsetzen
6. Monthly Reminder umsetzen
7. Weekly Wrap-Up umsetzen
8. Trial Ending Push umsetzen

Begruendung:

- Daily Reminder hat die geringste fachliche Komplexitaet und validiert den kompletten Push-Stack.
- Weekly und Trial-Ende brauchen mehr Fachlogik und abgeleitete Daten.

## Offene Uebersetzungen

Uebersetzungen werden vorerst vernachlaessigt, muessen aber explizit nachgezogen werden.

Spaetere TODOs fuer i18n:

- Notification-Texte nicht hartkodiert in Jobs persistieren, sondern ueber Keys oder Templates ableiten.
- Sprachwahl pro User aus `user_settings.language` beruecksichtigen.
- Fallback-Sprache definieren.
- Platzhalter wie Betrag, XP oder Datum lokalisieren.

## Erste konkrete Umsetzungspakete

Paket A:

- [ ] DB-Migration fuer `user_settings`
- [ ] DB-Migration fuer `push_tokens`
- [ ] Client-Service fuer Permission + Token Registration

Paket B:

- [ ] DB-Migration fuer `notification_campaigns`
- [ ] DB-Migration fuer `notification_jobs`
- [ ] Scheduler fuer Daily Habit Reminder

Paket C:

- [ ] Versand-Worker
- [ ] Invalid-Token Handling
- [ ] Deep-Link-Handling im Client

Paket D:

- [ ] Weekly Wrap-Up Logik
- [ ] Monthly Reminder Logik
- [ ] Trial-Ending Logik

## Entscheidungsempfehlung

Wenn ihr risikoarm starten wollt, sollte zuerst nur der Daily Habit Reminder als kompletter End-to-End-Flow live gehen. Danach folgen Monthly, Weekly und zuletzt Trial Ending, weil dort die Abhaengigkeit zu Subscription-/Access-Daten am groessten ist.
