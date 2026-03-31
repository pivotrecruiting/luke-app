import { supabase } from "@/lib/supabase";

export type BillingProductT = {
  id: string;
  productKey: "monthly" | "yearly" | "lifetime";
  displayName: string;
  billingInterval: "monthly" | "yearly" | "lifetime";
  priceAmountCents: number;
  currency: string;
};

type BillingProductRowT = {
  id: string;
  product_key: string;
  display_name: string;
  billing_interval: string;
  price_amount_cents: number;
  currency: string;
};

const isSupportedProductKey = (
  value: string,
): value is BillingProductT["productKey"] =>
  value === "monthly" || value === "yearly" || value === "lifetime";

export const listActiveBillingProducts = async (): Promise<
  BillingProductT[]
> => {
  const { data, error } = await supabase
    .from("billing_products")
    .select(
      "id, product_key, display_name, billing_interval, price_amount_cents, currency, sort_order",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BillingProductRowT[])
    .filter((row) => isSupportedProductKey(row.product_key))
    .map((row) => {
      const productKey = row.product_key as BillingProductT["productKey"];
      const billingInterval =
        row.billing_interval === "monthly" ||
        row.billing_interval === "yearly" ||
        row.billing_interval === "lifetime"
          ? row.billing_interval
          : productKey;

      return {
        id: row.id,
        productKey,
        displayName: row.display_name,
        billingInterval: billingInterval as BillingProductT["billingInterval"],
        priceAmountCents: row.price_amount_cents,
        currency: row.currency,
      } satisfies BillingProductT;
    });
};
