import type { CurrencyCode } from "@/context/AppContext";
import { numericFormatter } from "react-number-format";

type NumberSeparatorsT = {
  decimalSeparator: string;
  thousandSeparator: string;
};

const FALLBACK_SEPARATORS: Record<CurrencyCode, NumberSeparatorsT> = {
  EUR: { decimalSeparator: ",", thousandSeparator: "." },
  USD: { decimalSeparator: ".", thousandSeparator: "," },
  CHF: { decimalSeparator: ".", thousandSeparator: "'" },
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: "€",
  USD: "$",
  CHF: "CHF",
};

export const getCurrencySymbol = (currency: CurrencyCode): string =>
  CURRENCY_SYMBOLS[currency] ?? currency;

export const getCurrencySeparators = (
  currency: CurrencyCode,
): NumberSeparatorsT => {
  return (
    FALLBACK_SEPARATORS[currency] ?? {
      decimalSeparator: ",",
      thousandSeparator: ".",
    }
  );
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  EUR: "de-DE",
  USD: "en-US",
  CHF: "de-CH",
};

export const formatCurrencyAmount = (
  value: number,
  currency: CurrencyCode,
): string => {
  const locale = CURRENCY_LOCALES[currency] ?? "de-DE";
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrencyValue = (
  value: string,
  currency: CurrencyCode,
  options: { allowNegative?: boolean } = {},
): string => {
  if (value.trim() === "") {
    return "";
  }

  const { decimalSeparator, thousandSeparator } =
    getCurrencySeparators(currency);

  return numericFormatter(value, {
    decimalSeparator,
    thousandSeparator,
    fixedDecimalScale: true,
    allowNegative: options.allowNegative ?? false,
  });
};
