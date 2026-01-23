export const toCents = (value: number): number => Math.round(value * 100);

export const fromCents = (value: number | null | undefined): number =>
  (value ?? 0) / 100;
