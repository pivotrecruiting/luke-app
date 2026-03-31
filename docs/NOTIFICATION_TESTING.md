# Notification Testing

Diese Anleitung beschreibt den manuellen End-to-End-Test fuer Push-Benachrichtigungen in der App.

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
3. Test-Job einfuegen
4. Dispatcher per `curl` triggern
5. `notification_jobs` und `notification_deliveries` pruefen
6. Push auf dem Geraet bestaetigen
