import type { CurrencyCode } from "@/context/AppContext";
import { formatCurrencyAmount } from "@/utils/currency-format";

export const formatCurrency = (value: number, currency?: CurrencyCode) => {
  if (currency) {
    return formatCurrencyAmount(value, currency);
  }
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
