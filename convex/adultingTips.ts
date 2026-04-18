import { getAuthUserId } from '@convex-dev/auth/server';

import { query } from './_generated/server';

interface Tip {
  id: string;
  category: 'sleep' | 'movement' | 'mindfulness' | 'hydration' | 'consistency';
  title: string;
  body: string;
}

/**
 * Static bank of Adulting Tips. Safe, vetted content. Phase 3 ships with this
 * bank; Phase 3.5 (after user behavior data) can layer Claude-personalized
 * variants on top.
 */
const TIP_BANK: Tip[] = [
  {
    id: 'sleep_focus',
    category: 'sleep',
    title: 'Sen to paliwo dla koncentracji',
    body: 'Badania pokazują, że mniej niż 7h snu obniża koncentrację tak samo jak 0,08‰ alkoholu. Regularny sen to Twoja przewaga na studiach i w pracy.',
  },
  {
    id: 'movement_mood',
    category: 'movement',
    title: 'Ruch zmienia nastrój szybciej niż myślisz',
    body: '15 minut spaceru obniża poziom kortyzolu o ~20%. Kiedy nie chce Ci się nic robić, spróbuj ruszyć się przez kwadrans.',
  },
  {
    id: 'mindfulness_stress',
    category: 'mindfulness',
    title: 'Oddech to najprostszy reset',
    body: 'Technika 4-7-8 (wdech 4 sek, zatrzymanie 7, wydech 8) aktywuje układ przywspółczulny i obniża tętno w 90 sekund.',
  },
  {
    id: 'hydration_energy',
    category: 'hydration',
    title: 'Zmęczenie często jest odwodnieniem',
    body: 'Nawet 2% odwodnienia obniża koncentrację o ~10%. Jeśli czujesz się senny po południu, zacznij od szklanki wody.',
  },
  {
    id: 'consistency_over_intensity',
    category: 'consistency',
    title: 'Konsekwencja bije intensywność',
    body: '10 minut dziennie przez 30 dni > 2 godziny raz w tygodniu. Twój mózg uczy się przez powtarzanie.',
  },
  {
    id: 'sleep_blue_light',
    category: 'sleep',
    title: 'Ekran po 22:00 opóźnia zasypianie',
    body: 'Niebieskie światło z telefonu blokuje melatoninę nawet na 90 min. Tryb nocny pomaga, ale odłożenie telefonu pomaga bardziej.',
  },
  {
    id: 'movement_short_walks',
    category: 'movement',
    title: 'Spacery po jedzeniu stabilizują cukier',
    body: '5–10 min spaceru po posiłku obniża skok cukru o ~30%. Mniejsze "doły energetyczne" w ciągu dnia.',
  },
  {
    id: 'mindfulness_naming',
    category: 'mindfulness',
    title: 'Nazywanie emocji zmniejsza ich intensywność',
    body: 'Gdy powiesz "czuję niepokój" zamiast "jest źle", Twój mózg (kora przedczołowa) przejmuje kontrolę nad emocją. To trening na całe życie.',
  },
];

function weekIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export const getThisWeekTip = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // Anonymous users still get a rotating tip — pick by week index only.
    const idx = weekIndex() % TIP_BANK.length;
    const tip = TIP_BANK[idx];

    // Personalize slightly by user's focus categories if available
    if (userId) {
      const user = await ctx.db.get(userId);
      const focus = user && 'focusCategories' in user ? user.focusCategories : null;
      if (focus && focus.length > 0) {
        const matching = TIP_BANK.filter((t) =>
          focus.some((f: string) => f === t.category || (f === 'mood' && t.category === 'mindfulness')),
        );
        if (matching.length > 0) {
          return matching[idx % matching.length];
        }
      }
    }

    return tip;
  },
});
