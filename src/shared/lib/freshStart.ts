/**
 * Detects whether today is a Fresh Start trigger day in the user's local
 * timezone. Runs entirely client-side — no server round trip. When a push
 * channel ships, the same detector can move to the server for scheduled pushes.
 */

export type FreshStartEvent = 'monday' | 'month' | 'birthday' | 'semester';

interface DetectArgs {
  now?: Date;
  birthYear?: number | null;
  /** Birth date in YYYY-MM-DD in user's locale — optional for this MVP. */
  birthMonthDay?: { month: number; day: number } | null;
  /** Array of YYYY-MM-DD semester-start dates. */
  schoolSemesterDates?: readonly string[] | null;
}

/** Returns the highest-priority trigger for today, or null. */
export function detectFreshStart({
  now = new Date(),
  birthMonthDay = null,
  schoolSemesterDates = null,
}: DetectArgs = {}): FreshStartEvent | null {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const weekday = now.getDay(); // 0=Sun, 1=Mon, ...
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  if (birthMonthDay && birthMonthDay.month === m && birthMonthDay.day === d) {
    return 'birthday';
  }
  if (schoolSemesterDates?.includes(iso)) {
    return 'semester';
  }
  if (d === 1) return 'month';
  if (weekday === 1) return 'monday';
  return null;
}

/** Start/end of the window the commitment covers. */
export function periodForEvent(
  event: FreshStartEvent,
  now: Date = new Date(),
): { start: number; end: number } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  switch (event) {
    case 'monday':
      end.setDate(end.getDate() + 7);
      break;
    case 'month': {
      // End of the current month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // last day of previous (= current) month
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'birthday':
      end.setFullYear(end.getFullYear() + 1);
      break;
    case 'semester':
      end.setMonth(end.getMonth() + 4);
      break;
  }
  return { start: start.getTime(), end: end.getTime() };
}
