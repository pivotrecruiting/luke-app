# Notification Job Generator

This Edge Function manually triggers `public.queue_due_notification_jobs()` for smoke tests or trusted automation.

## Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOTIFICATION_FUNCTION_AUTH_HEADER`

## Deployment settings

- Function name: `notification-job-generator`
- `verify_jwt`: `false`

This function is optional for production scheduling because `migrations/028_notification_dispatch_infra.sql` already schedules the queueing step directly in Postgres via `pg_cron`.
