# RevenueCat Supabase Commands

## 1. Set client env vars

Replace the old typo key in `.env`:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<ios_public_sdk_key>
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<android_public_sdk_key>
```

Remove:

```env
REVENUECAT_API_KEY=...
```

## 2. Set Supabase function secret

```bash
supabase secrets set REVENUECAT_WEBHOOK_AUTH_HEADER='Bearer <your_shared_secret>'
```

## 3. Deploy the webhook function

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

## 4. Configure RevenueCat webhook

Webhook URL:

```text
https://urbgiubqunvsqlmodhyb.supabase.co/functions/v1/revenuecat-webhook
```

Authorization header value:

```text
Bearer <your_shared_secret>
```

## 5. Fill and run the store-mapping migration

Edit:

```text
supabase/migrations/20260331143000_revenuecat_store_mappings.sql
```

Replace all placeholders:

- `__FILL_IOS_MONTHLY_PRODUCT_ID__`
- `__FILL_IOS_YEARLY_PRODUCT_ID__`
- `__FILL_IOS_LIFETIME_PRODUCT_ID__`
- `__FILL_ANDROID_MONTHLY_PRODUCT_ID__`
- `__FILL_ANDROID_YEARLY_PRODUCT_ID__`
- `__FILL_ANDROID_LIFETIME_PRODUCT_ID__`

Then apply the local migrations:

```bash
supabase db push
```

## 6. Validate the setup

```sql
select *
from public.get_revenuecat_setup_status();
```

```sql
select
  product_key,
  display_name,
  billing_interval,
  price_amount_cents,
  currency
from public.billing_products
order by sort_order asc;
```

```sql
select
  bp.product_key,
  m.platform,
  m.store_product_id,
  m.revenuecat_entitlement_id,
  m.revenuecat_offering_id,
  m.revenuecat_package_identifier
from public.billing_product_store_mappings m
join public.billing_products bp
  on bp.id = m.billing_product_id
order by bp.product_key asc, m.platform asc;
```

## 7. Optional local function serve

Create local function env:

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

Then fill:

```env
REVENUECAT_WEBHOOK_AUTH_HEADER=Bearer <your_shared_secret>
```

Serve locally:

```bash
supabase functions serve revenuecat-webhook --no-verify-jwt
```

## 8. Optional live test

After deployment, send a RevenueCat test event from the dashboard and verify:

```sql
select event_id, event_type, app_user_id, received_at, processed_at, processing_error
from public.revenuecat_events
order by received_at desc
limit 20;
```

```sql
select user_id, app_user_id, original_app_user_id, last_seen_at, last_synced_at
from public.revenuecat_customers
order by updated_at desc
limit 20;
```

```sql
select user_id, access_key, source_type, status, starts_at, ends_at, metadata
from public.user_access_grants
where source_type = 'revenuecat'
order by updated_at desc
limit 20;
```
