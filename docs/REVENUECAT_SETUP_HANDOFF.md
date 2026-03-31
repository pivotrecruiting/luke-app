# RevenueCat Setup Handoff

## Status

- Client integration is implemented.
- Webhook function source exists in `supabase/functions/revenuecat-webhook`.
- `billing_products` is populated.
- `billing_product_store_mappings` is still empty.
- Edge Function deployment via MCP was blocked with:
  `Cannot deploy an edge function in read-only mode.`

## 1. Client env vars

Your current app env still contains the wrong legacy key name:

```env
REVENUECAT_API_KEY=...
```

Replace that setup with the public Expo env vars expected by the app:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<ios_public_sdk_key>
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<android_public_sdk_key>
```

Important:

- Use the real RevenueCat public SDK key for each platform.
- Do not reuse one guessed key for both platforms unless RevenueCat explicitly shows the same key for both.

## 2. Edge Function secret

Set this hosted secret in Supabase:

```env
REVENUECAT_WEBHOOK_AUTH_HEADER=Bearer <your_shared_secret>
```

Use the exact same Authorization header value in the RevenueCat webhook settings.

## 3. Deploy the function

Deploy `revenuecat-webhook` with JWT verification disabled.

Reason:

- RevenueCat is an external webhook sender and does not send a Supabase JWT.

Function path:

- `supabase/functions/revenuecat-webhook/index.ts`

Webhook URL after deployment:

- `https://urbgiubqunvsqlmodhyb.supabase.co/functions/v1/revenuecat-webhook`

## 4. Fill store mappings

Use this file as the exact SQL template:

- `private/revenuecat-store-mappings.example.sql`

You must replace:

- `<ios_monthly_product_id>`
- `<ios_yearly_product_id>`
- `<ios_lifetime_product_id>`
- `<android_monthly_product_id>`
- `<android_yearly_product_id>`
- `<android_lifetime_product_id>`

Current `billing_products` rows:

- `monthly` → `7eca21e2-63f6-43d7-ab3e-d0a5f8769a8b`
- `yearly` → `624a1c21-657c-4ecf-afd1-69e59ebf9967`
- `lifetime` → `6dbabf26-c622-45bf-96a8-4dbd81bab8b4`

## 5. RevenueCat dashboard alignment

Recommended alignment:

- Entitlement: `pro`
- Offering: `default`
- Packages:
  - Monthly → `$rc_monthly`
  - Yearly → `$rc_annual`
  - Lifetime → `$rc_lifetime`

## 6. First live validation

Run these checks in order:

1. Open the app with a fresh account and confirm the 7-day app trial is active.
2. Confirm the paywall does not auto-open before the 3-day warning window.
3. Buy monthly/yearly/lifetime in sandbox.
4. Confirm a webhook row appears in `public.revenuecat_events`.
5. Confirm `public.revenuecat_customers` is upserted.
6. Confirm `public.user_access_grants` contains an active `source_type = 'revenuecat'` row.
7. Confirm `get_my_access_state()` returns `has_access = true` and `paywall_required = false`.

## 7. Known limitation

`TRANSFER` events are intentionally treated as audit-only right now.

That is acceptable as long as this rule stays true:

- RevenueCat `app_user_id` is always the Supabase `users.id`
