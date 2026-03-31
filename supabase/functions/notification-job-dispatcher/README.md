# Notification Job Dispatcher

This Edge Function claims pending push notification jobs from the database and sends them via the Expo Push API.

## Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOTIFICATION_FUNCTION_AUTH_HEADER`
- `EXPO_PUSH_ACCESS_TOKEN`
  Optional, but recommended for authenticated Expo Push API calls.

## Deployment settings

- Function name: `notification-job-dispatcher`
- `verify_jwt`: `false`

The function uses a custom shared authorization header because it is intended to be called by a cron job or trusted backend automation, not by the public client.

## Vault secrets for cron scheduling

`migrations/028_notification_dispatch_infra.sql` can auto-schedule a cron call to this function if these Vault secrets already exist:

- `notification_dispatch_url`
  Example: `https://<project-ref>.supabase.co/functions/v1/notification-job-dispatcher`
- `notification_dispatch_auth_header`
  Example: `Bearer <same value as NOTIFICATION_FUNCTION_AUTH_HEADER>`

## Behavior

1. Claims pending jobs atomically via `public.claim_pending_notification_jobs`.
2. Loads active push tokens per user.
3. Sends messages to the Expo Push API.
4. Stores token-level delivery results in `public.notification_deliveries`.
5. Deactivates invalid tokens.
6. Marks jobs as `sent`, `pending`, `failed`, or `cancelled`.
