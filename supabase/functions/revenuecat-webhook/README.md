# RevenueCat Webhook

This Edge Function receives RevenueCat webhooks and translates them into the app's single source of truth: `public.user_access_grants`.

## Required secrets

- `REVENUECAT_WEBHOOK_AUTH_HEADER`
  Use the exact shared authorization header value configured in the RevenueCat webhook settings.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deployment settings

- Function name: `revenuecat-webhook`
- `verify_jwt`: `false`
  RevenueCat is an external webhook caller and does not send a Supabase JWT.

## RevenueCat configuration

- Webhook URL:
  `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
- Authorization header:
  Must exactly match `REVENUECAT_WEBHOOK_AUTH_HEADER`

## Data flow

1. Every webhook event is stored in `public.revenuecat_events`.
2. The function resolves the Supabase user from `app_user_id`, `original_app_user_id`, aliases, or transfer arrays.
3. `public.revenuecat_customers` is upserted for audit and identity mapping.
4. Access is created or updated only in `public.user_access_grants`.

## Important limitation

`TRANSFER` events are currently treated as audit-only events. With the enforced best practice `RevenueCat app_user_id = public.users.id`, transfers should be exceptional. If you expect frequent transfers, add a follow-up step that rehydrates customer state from the RevenueCat REST API after a transfer event.
