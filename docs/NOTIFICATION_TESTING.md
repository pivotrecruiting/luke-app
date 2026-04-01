# Notification Testing

insert into public.notification_jobs (
user_id,
campaign_id,
scheduled_for,
status,
dedupe_key,
payload
)
select
'22b99a25-2ae9-4e1c-b50d-31343d9c6a70'::uuid,
c.id,
now(),
'pending',
'manual-' || c.key || '-' || gen_random_uuid()::text,
case c.key
when 'daily_habit' then jsonb_build_object(
'title', 'Daily Reminder Test',
'body', 'Teste den taeglichen Reminder.',
'deeplink', 'luke://add'
)
when 'weekly_wrap_up' then jsonb_build_object(
'title', 'Weekly Reminder Test',
'body', 'Teste den Weekly Recap.',
'deeplink', 'luke://insights'
)
when 'monthly_check' then jsonb_build_object(
'title', 'Monthly Reminder Test',
'body', 'Teste den monatlichen Reminder.',
'deeplink', 'luke://home'
)
when 'trial_ending' then jsonb_build_object(
'title', 'Trial Ending Test',
'body', 'Teste die Trial-Ende Erinnerung.',
'deeplink', 'luke://paywall'
)
end
from public.notification_campaigns c
where c.key in ('daily_habit', 'weekly_wrap_up', 'monthly_check', 'trial_ending')
and c.is_enabled = true
returning id, dedupe_key, payload->>'title' as title;

    curl -i \
    -X POST \
    "https://urbgiubqunvsqlmodhyb.supabase.co/functions/v1/notification-job-dispatcher" \
    -H "Authorization: Bearer D9E9E881-9D09-4056-814E-8285D9588CF0" \
    -H "Content-Type: application/json" \
    -d '{"limit":10}'

Diese Anleitung beschreibt den manuellen End-to-End-Test fuer Push-Benachrichtigungen in der App.

## Aktueller DB-Stand

Die Notification-Kampagnen sind in der DB vorhanden und aktiv:

- `daily_habit`
- `weekly_wrap_up`
- `monthly_check`
- `trial_ending`

Wichtig:

- `notification_campaigns` sind die statischen Kampagnen-Definitionen.
- `notification_jobs` sind die konkreten Versand-Jobs.
- `notification_jobs` werden nicht dauerhaft vorab angelegt, sondern erst:
  - durch `queue_due_notification_jobs(now())`
  - oder durch einen manuellen Test-Insert

Zum Pruefen der Kampagnen:

```sql
select id, key, channel, is_enabled
from public.notification_campaigns
order by key asc;
```

## Voraussetzungen

- Die App laeuft auf einem echten iPhone oder Android-Geraet.
- Push-Berechtigungen sind im Betriebssystem erlaubt.
- Push ist in der App im `ProfileScreen` aktiviert.
- Die Notification-Functions sind deployed:
  - `notification-job-generator`
  - `notification-job-dispatcher`
- Die Migrationen fuer Push/Notification-Infrastruktur sind angewendet.

## 1. Push in der App aktivieren

1. App auf dem echten Geraet oeffnen.
2. Zum `ProfileScreen` wechseln.
3. `Push-Benachrichtigungen` aktivieren.
4. iOS-/Android-Permission bestaetigen.

## 2. Pruefen, ob ein Push-Token gespeichert wurde

Fuehre in Supabase SQL aus:

```sql
select id, user_id, token, platform, is_active, last_seen_at
from public.push_tokens
order by created_at desc
limit 20;
```

Erwartung:

- Es gibt einen Eintrag fuer den Test-User.
- `is_active = true`

## 3. Test-Notification als Job manuell anlegen

Ersetze `DEINE_USER_ID` durch die User-ID des Test-Users.

```sql
insert into public.notification_jobs (
  user_id,
  campaign_id,
  scheduled_for,
  status,
  dedupe_key,
  payload
)
select
  'DEINE_USER_ID'::uuid,
  id,
  now(),
  'pending',
  'manual-test-' || gen_random_uuid()::text,
  jsonb_build_object(
    'title', 'Test Push',
    'body', 'Wenn du das siehst, funktioniert der Dispatcher.',
    'deeplink', 'luke://home'
  )
from public.notification_campaigns
where key = 'daily_habit'
limit 1;
```

## 3a. Daily Reminder separat testen

```sql
insert into public.notification_jobs (
  user_id,
  campaign_id,
  scheduled_for,
  status,
  dedupe_key,
  payload
)
select
  'DEINE_USER_ID'::uuid,
  id,
  now(),
  'pending',
  'manual-daily-test-' || gen_random_uuid()::text,
  jsonb_build_object(
    'title', 'Daily Reminder Test',
    'body', 'Teste den taeglichen Reminder.',
    'deeplink', 'luke://add'
  )
from public.notification_campaigns
where key = 'daily_habit'
limit 1;
```

## 3b. Weekly Reminder separat testen

```sql
insert into public.notification_jobs (
  user_id,
  campaign_id,
  scheduled_for,
  status,
  dedupe_key,
  payload
)
select
  'DEINE_USER_ID'::uuid,
  id,
  now(),
  'pending',
  'manual-weekly-test-' || gen_random_uuid()::text,
  jsonb_build_object(
    'title', 'Weekly Reminder Test',
    'body', 'Teste den Weekly Recap.',
    'deeplink', 'luke://insights'
  )
from public.notification_campaigns
where key = 'weekly_wrap_up'
limit 1;
```

## 3c. Monthly Reminder separat testen

```sql
insert into public.notification_jobs (
  user_id,
  campaign_id,
  scheduled_for,
  status,
  dedupe_key,
  payload
)
select
  'DEINE_USER_ID'::uuid,
  id,
  now(),
  'pending',
  'manual-monthly-test-' || gen_random_uuid()::text,
  jsonb_build_object(
    'title', 'Monthly Reminder Test',
    'body', 'Teste den monatlichen Reminder.',
    'deeplink', 'luke://home'
  )
from public.notification_campaigns
where key = 'monthly_check'
limit 1;
```

## 3d. Trial-Ende Erinnerung separat testen

```sql
insert into public.notification_jobs (
  user_id,
  campaign_id,
  scheduled_for,
  status,
  dedupe_key,
  payload
)
select
  'DEINE_USER_ID'::uuid,
  id,
  now(),
  'pending',
  'manual-trial-test-' || gen_random_uuid()::text,
  jsonb_build_object(
    'title', 'Trial Ending Test',
    'body', 'Teste die Trial-Ende Erinnerung.',
    'deeplink', 'luke://paywall'
  )
from public.notification_campaigns
where key = 'trial_ending'
limit 1;
```

## 4. Dispatcher manuell triggern

```bash
curl -i \
  -X POST \
  "https://urbgiubqunvsqlmodhyb.supabase.co/functions/v1/notification-job-dispatcher" \
  -H "Authorization: Bearer D9E9E881-9D09-4056-814E-8285D9588CF0" \
  -H "Content-Type: application/json" \
  -d '{"limit":10}'
```

Erwartung:

- Kein `401`
- Kein `500`
- JSON mit `ok: true`

## 5. Ergebnis in der Datenbank pruefen

### Notification-Jobs

```sql
select id, status, error_message, sent_at, updated_at
from public.notification_jobs
order by updated_at desc
limit 20;
```

### Deliveries

```sql
select notification_job_id, push_token_id, status, provider_message_id, error_message, created_at
from public.notification_deliveries
order by created_at desc
limit 20;
```

Erwartung:

- Der Job wechselt auf `sent`, `failed`, `pending` oder `cancelled`
- Es entsteht ein Eintrag in `notification_deliveries`
- Bei Erfolg kommt die Push auf dem Testgeraet an

## 6. Alternative: echte Queue-Logik testen

Wenn nicht der manuelle Insert, sondern die echte Queue-Logik getestet werden soll:

```sql
select public.queue_due_notification_jobs(now());
```

### Hinweise zur echten Queue-Logik

- `daily_habit` wird nur erzeugt, wenn `daily_reminder_enabled = true` und das lokale Reminder-Zeitfenster getroffen ist.
- `weekly_wrap_up` wird nur erzeugt, wenn:
  - `weekly_report_enabled = true`
  - der konfigurierte Wochentag erreicht ist
  - im vorherigen Wochenzeitraum Ausgaben vorhanden sind
- `monthly_check` wird nur erzeugt, wenn:
  - `monthly_reminder_enabled = true`
  - der konfigurierte Monatstag erreicht ist
- `trial_ending` wird nur erzeugt, wenn:
  - `trial_ending_push_enabled = true`
  - ein aktiver Trial-Access-Grant vorhanden ist
  - kein bezahlter aktiver Access existiert
  - das Trial-Ende im konfigurierten Fenster liegt

Fuer isolierte Funktionstests ist daher der manuelle Insert pro Kampagne meist der schnellere und eindeutigere Weg.

Danach erneut den Dispatcher triggern:

```bash
curl -i \
  -X POST \
  "https://urbgiubqunvsqlmodhyb.supabase.co/functions/v1/notification-job-dispatcher" \
  -H "Authorization: Bearer D9E9E881-9D09-4056-814E-8285D9588CF0" \
  -H "Content-Type: application/json" \
  -d '{"limit":10}'
```

## 7. Fehleranalyse

Wenn keine Push ankommt, diese Punkte pruefen:

- `public.push_tokens` enthaelt einen aktiven Token
- Die App hat OS-Permission fuer Push
- Der Job steht auf `pending` oder wurde korrekt verarbeitet
- `notification_deliveries.error_message` enthaelt keine permanente Fehlermeldung
- Der Dispatcher antwortet mit `ok: true`

## 8. Optionaler kompletter Smoke-Test

Reihenfolge:

1. Push im `ProfileScreen` aktivieren
2. Token in `public.push_tokens` pruefen
3. Test-Job fuer die gewuenschte Kampagne einfuegen
4. Dispatcher per `curl` triggern
5. `notification_jobs` und `notification_deliveries` pruefen
6. Push auf dem Geraet bestaetigen
