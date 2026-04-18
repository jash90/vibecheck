import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

crons.daily(
  'daily low-mood check',
  { hourUTC: 19, minuteUTC: 0 }, // 19:00 UTC → ~20:00-21:00 PL / CET
  internal.safety.detectLowMoodUsers,
  {},
);

crons.weekly(
  'weekly AI insight generation',
  { dayOfWeek: 'sunday', hourUTC: 18, minuteUTC: 0 }, // Sunday evening
  internal.insights.generateWeeklyReports,
  {},
);

export default crons;
