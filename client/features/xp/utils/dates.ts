export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
};

export const isSameLocalDay = (a: Date, b: Date): boolean => {
  return getLocalDateKey(a) === getLocalDateKey(b);
};
