export const parseFormattedDate = (dateStr: string): Date => {
  const now = new Date();

  if (dateStr.startsWith("Heute")) {
    const timeMatch = dateStr.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(timeMatch[1]),
        parseInt(timeMatch[2]),
      );
    }
    return now;
  }

  if (dateStr === "Gestern" || dateStr.startsWith("Gestern")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  const slashMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(
      parseInt(slashMatch[3]),
      parseInt(slashMatch[2]) - 1,
      parseInt(slashMatch[1]),
    );
  }

  const dotTimeMatch = dateStr.match(/(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/);
  if (dotTimeMatch) {
    return new Date(
      now.getFullYear(),
      parseInt(dotTimeMatch[2]) - 1,
      parseInt(dotTimeMatch[1]),
      parseInt(dotTimeMatch[3]),
      parseInt(dotTimeMatch[4]),
    );
  }

  const fullDotMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (fullDotMatch) {
    return new Date(
      parseInt(fullDotMatch[3]),
      parseInt(fullDotMatch[2]) - 1,
      parseInt(fullDotMatch[1]),
    );
  }

  return now;
};

export const getWeekBounds = (
  weekOffset: number,
): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
};

export const formatWeekLabel = (weekOffset: number): string => {
  if (weekOffset === 0) {
    return "Diese Woche";
  }
  const { start, end } = getWeekBounds(weekOffset);
  const formatDay = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${formatDay(start)} - ${formatDay(end)}`;
};

export const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Heute, ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Gestern";
  }
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};
