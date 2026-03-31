import { assertEquals } from "jsr:@std/assert@1";
import {
  buildRevenueCatGrantMetadata,
  resolveAccessWindowFromEvent,
  resolveCandidateAppUserIds,
  resolveEntitlementKeyFromEvent,
  resolveGrantStatusFromEvent,
  resolvePlatformFromStore,
  toIsoTimestamp,
} from "../_shared/revenuecat-webhook.ts";

Deno.test(
  "resolveGrantStatusFromEvent maps RevenueCat lifecycle events correctly",
  () => {
    assertEquals(resolveGrantStatusFromEvent("INITIAL_PURCHASE"), "active");
    assertEquals(resolveGrantStatusFromEvent("CANCELLATION"), "active");
    assertEquals(resolveGrantStatusFromEvent("EXPIRATION"), "expired");
    assertEquals(resolveGrantStatusFromEvent("REFUND"), "revoked");
    assertEquals(resolveGrantStatusFromEvent("TEST"), null);
    assertEquals(resolveGrantStatusFromEvent("TRANSFER"), null);
  },
);

Deno.test("resolvePlatformFromStore normalizes supported store names", () => {
  assertEquals(resolvePlatformFromStore("APP_STORE"), "ios");
  assertEquals(resolvePlatformFromStore("MAC_APP_STORE"), "ios");
  assertEquals(resolvePlatformFromStore("PLAY_STORE"), "android");
  assertEquals(resolvePlatformFromStore("STRIPE"), null);
});

Deno.test(
  "resolveCandidateAppUserIds deduplicates aliases and transfer arrays",
  () => {
    assertEquals(
      resolveCandidateAppUserIds({
        app_user_id: "user-1",
        original_app_user_id: "user-1",
        aliases: ["user-2", "user-2", "user-3"],
        transferred_from: ["user-4"],
        transferred_to: ["user-5"],
      }),
      ["user-1", "user-2", "user-3", "user-4", "user-5"],
    );
  },
);

Deno.test(
  "resolveEntitlementKeyFromEvent prefers webhook entitlement ids",
  () => {
    assertEquals(
      resolveEntitlementKeyFromEvent(
        { entitlement_ids: ["pro_plus", "pro"] },
        "pro",
      ),
      "pro_plus",
    );
    assertEquals(resolveEntitlementKeyFromEvent({}, "pro"), "pro");
  },
);

Deno.test(
  "resolveAccessWindowFromEvent prefers grace period expiration",
  () => {
    const result = resolveAccessWindowFromEvent({
      purchased_at_ms: 1735689600000,
      expiration_at_ms: 1736294400000,
      grace_period_expiration_at_ms: 1736380800000,
    });

    assertEquals(result.startsAt, "2025-01-01T00:00:00.000Z");
    assertEquals(result.endsAt, "2025-01-09T00:00:00.000Z");
  },
);

Deno.test(
  "buildRevenueCatGrantMetadata produces normalized audit metadata",
  () => {
    const metadata = buildRevenueCatGrantMetadata(
      {
        id: "event-1",
        type: "INITIAL_PURCHASE",
        app_user_id: "user-1",
        aliases: ["user-2"],
        entitlement_ids: ["pro"],
        product_id: "luke_yearly",
        store: "APP_STORE",
        purchased_at_ms: 1735689600000,
      },
      { custom: "value" },
    );

    assertEquals(metadata.provider, "revenuecat");
    assertEquals(metadata.latest_event_id, "event-1");
    assertEquals(metadata.aliases, ["user-2"]);
    assertEquals(metadata.entitlement_ids, ["pro"]);
    assertEquals(metadata.product_id, "luke_yearly");
    assertEquals(metadata.purchased_at, "2025-01-01T00:00:00.000Z");
    assertEquals(metadata.custom, "value");
  },
);

Deno.test("toIsoTimestamp returns null for invalid values", () => {
  assertEquals(toIsoTimestamp(null), null);
  assertEquals(toIsoTimestamp(""), null);
  assertEquals(toIsoTimestamp("not-a-date"), null);
});
