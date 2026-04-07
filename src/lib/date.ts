const DAY_MS = 24 * 60 * 60 * 1000;

export function toRequestedDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function toDailyTimestamp(date: Date) {
  const utcMidday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
  return utcMidday.toISOString().slice(0, 19);
}

export function parseDateOnly(input: string) {
  const parsed = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function isWithinLastMonth(targetDate: Date, now = new Date()) {
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const targetUtc = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

  const diffMs = todayUtc.getTime() - targetUtc.getTime();
  const maxMs = 31 * DAY_MS;

  return diffMs >= 0 && diffMs <= maxMs;
}
