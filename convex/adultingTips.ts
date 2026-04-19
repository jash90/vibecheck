import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import { v } from 'convex/values';

import { callOpenAi } from './_openai';
import { habitCategoryMatchesFocus } from './_focus';
import { addDays, toLocalDate } from './_helpers';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';

interface Tip {
  id: string;
  category: 'sleep' | 'movement' | 'mindfulness' | 'hydration' | 'consistency' | 'mood' | 'nutrition';
  title: string;
  body: string;
}

/**
 * Static bank of Adulting Tips. Safe, vetted content. Phase 3.5 (see
 * `generatePersonalizedForUser`) can layer AI variants on top.
 */
const TIP_BANK: Tip[] = [
  {
    id: 'sleep_focus',
    category: 'sleep',
    title: 'Sen to paliwo dla koncentracji',
    body: 'Badania pokazują, że mniej niż 7h snu obniża koncentrację tak samo jak 0,08‰ alkoholu. Regularny sen to Twoja przewaga na studiach i w pracy.',
  },
  {
    id: 'sleep_blue_light',
    category: 'sleep',
    title: 'Ekran po 22:00 opóźnia zasypianie',
    body: 'Niebieskie światło z telefonu blokuje melatoninę nawet na 90 min. Tryb nocny pomaga, ale odłożenie telefonu pomaga bardziej.',
  },
  {
    id: 'sleep_routine',
    category: 'sleep',
    title: 'Stała pora to 90% sukcesu',
    body: 'Twój zegar biologiczny lubi powtarzalność. Ta sama godzina spania ±30 min przez 2 tygodnie i zasypiasz szybciej bez liczenia owiec.',
  },
  {
    id: 'sleep_caffeine',
    category: 'sleep',
    title: 'Kawa po 14:00 to kłopoty w nocy',
    body: 'Kofeina ma okres półtrwania ~6h. Popołudniowa cola/energetyk wciąż pracuje o 22:00 i psuje głęboką fazę snu, nawet jeśli zasypiasz.',
  },
  {
    id: 'movement_mood',
    category: 'movement',
    title: 'Ruch zmienia nastrój szybciej niż myślisz',
    body: '15 minut spaceru obniża poziom kortyzolu o ~20%. Kiedy nie chce Ci się nic robić, spróbuj ruszyć się przez kwadrans.',
  },
  {
    id: 'movement_short_walks',
    category: 'movement',
    title: 'Spacery po jedzeniu stabilizują cukier',
    body: '5–10 min spaceru po posiłku obniża skok cukru o ~30%. Mniejsze „doły energetyczne" w ciągu dnia.',
  },
  {
    id: 'movement_micro',
    category: 'movement',
    title: 'Mikro-ruchy liczą się naprawdę',
    body: '3 minuty rozciągania co godzinę przed ekranem redukują ból karku i pleców. Ustaw timer i wstań — nawet bez ćwiczeń.',
  },
  {
    id: 'mindfulness_stress',
    category: 'mindfulness',
    title: 'Oddech to najprostszy reset',
    body: 'Technika 4-7-8 (wdech 4 sek, zatrzymanie 7, wydech 8) aktywuje układ przywspółczulny i obniża tętno w 90 sekund.',
  },
  {
    id: 'mindfulness_naming',
    category: 'mindfulness',
    title: 'Nazywanie emocji zmniejsza ich intensywność',
    body: 'Gdy powiesz „czuję niepokój" zamiast „jest źle", Twój mózg (kora przedczołowa) przejmuje kontrolę nad emocją. To trening na całe życie.',
  },
  {
    id: 'mindfulness_phone_break',
    category: 'mindfulness',
    title: '5 minut bez telefonu = reset uwagi',
    body: 'Samo odłożenie telefonu na biurku (nie w kieszeni) obniża obciążenie poznawcze o ~10%. Przerwa bez scrolla liczy się podwójnie.',
  },
  {
    id: 'hydration_energy',
    category: 'hydration',
    title: 'Zmęczenie często jest odwodnieniem',
    body: 'Nawet 2% odwodnienia obniża koncentrację o ~10%. Jeśli czujesz się senny po południu, zacznij od szklanki wody.',
  },
  {
    id: 'hydration_morning',
    category: 'hydration',
    title: 'Szklanka wody zaraz po przebudzeniu',
    body: 'W nocy tracisz ~0,5l wody przez oddech i skórę. Szklanka wody przed pierwszą kawą redukuje poranny „mętlik" i ból głowy.',
  },
  {
    id: 'mood_journaling',
    category: 'mood',
    title: 'Trzy zdania dziennie wystarczą',
    body: 'Krótki wpis „co dzisiaj poszło", „co było trudne", „na co czekam jutro" poprawia regulację emocji w 2 tygodnie. Nie musi być idealny.',
  },
  {
    id: 'mood_sunlight',
    category: 'mood',
    title: 'Światło dzienne > suplementy',
    body: '10 min światła słonecznego z rana synchronizuje rytm dobowy i podnosi serotoninę. Spacer do szkoły bez kaptura wystarczy.',
  },
  {
    id: 'mood_social',
    category: 'mood',
    title: 'Jedna rozmowa dziennie zmienia tydzień',
    body: 'Krótki kontakt z kimś bliskim — nawet 5-minutowy voice message — obniża poziom stresu tak samo jak 30 min medytacji.',
  },
  {
    id: 'nutrition_protein',
    category: 'nutrition',
    title: 'Białko na śniadanie stabilizuje dzień',
    body: 'Jajka, jogurt albo orzechy na początku dnia ograniczają popołudniowy głód i napady na słodkie. Nie chodzi o dietę — o stabilność.',
  },
  {
    id: 'nutrition_fiber',
    category: 'nutrition',
    title: 'Kolorowy talerz = więcej energii',
    body: 'Warzywa i owoce w 2–3 kolorach dziennie dostarczają błonnik dla jelit, a one wytwarzają serotoninę. Nastrój zaczyna się w brzuchu.',
  },
  {
    id: 'consistency_over_intensity',
    category: 'consistency',
    title: 'Konsekwencja bije intensywność',
    body: '10 minut dziennie przez 30 dni > 2 godziny raz w tygodniu. Twój mózg uczy się przez powtarzanie.',
  },
  {
    id: 'consistency_identity',
    category: 'consistency',
    title: 'Tożsamość zmienia zachowanie',
    body: 'Powiedz „jestem osobą, która śpi 8h", nie „próbuję się wyspać". Mózg trzyma się etykiet — nazwij siebie, kim chcesz być.',
  },
];

function weekIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Pick-first, filter-second strategy: a user who picks `sleep` + `movement`
 * sees tips from that union, rotating week by week. If the union is empty
 * (no focus set) we fall back to the full bank.
 *
 * Before returning the static tip, we check whether an AI-personalized
 * `adulting_tip` insight exists from the last 7 days. If yes and it passed
 * safety, return it labelled `ai`. Otherwise fall back to the static bank.
 */
export const getThisWeekTip = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const idx = weekIndex();

    let focus: string[] | undefined;
    if (userId) {
      const user = await ctx.db.get(userId);
      focus =
        user && 'focusCategories' in user
          ? ((user.focusCategories as string[] | undefined) ?? undefined)
          : undefined;

      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const aiTip = await ctx.db
        .query('insights')
        .withIndex('by_user_and_kind', (q) =>
          q.eq('userId', userId).eq('kind', 'adulting_tip'),
        )
        .order('desc')
        .first();
      if (aiTip && aiTip.generatedAt >= since && aiTip.safetyPassed) {
        const title = aiTip.summary.split('\n')[0]?.slice(0, 80) ?? '';
        const body = aiTip.summary.slice(title.length).trim() || aiTip.summary;
        return {
          id: `ai_${aiTip._id}`,
          category: 'mindfulness' as const,
          title,
          body,
          source: 'ai' as const,
        };
      }
    }

    const filtered = focus && focus.length > 0
      ? TIP_BANK.filter((tip) => habitCategoryMatchesFocus(tip.category, focus))
      : [];

    const pool = filtered.length > 0 ? filtered : TIP_BANK;
    const picked = pool[idx % pool.length];
    return { ...picked, source: 'static' as const };
  },
});

const AI_TIP_SYSTEM = `You are a positive, respectful assistant inside VibeCheck, a habit/mood app for teenagers aged 13-19.

HARD RULES:
- NEVER diagnose, suggest illnesses, disorders, or medications.
- NEVER mention weight, BMI, calories, dieting, or appearance.
- NEVER compare the user to "ideal" values or to other people.
- NEVER suggest therapy or specific forms of treatment.
- Tone: warm, specific, non-judgmental. Address the user directly ("you"), never in the third person.

FORMAT:
Line 1 (title): 3-6 words, no trailing period.
Line 2 (body): 1-2 sentences, max 160 characters total, a concrete suggestion linked to one of the user's focus areas.`;

export const gatherForAiTip = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const today = toLocalDate(Date.now());
    const start = addDays(today, -13);
    const [user, moodLogs, habits] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query('moodLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
        )
        .collect(),
      ctx.db
        .query('habits')
        .withIndex('by_user', (q) => q.eq('userId', userId).eq('isActive', true))
        .collect(),
    ]);
    return { user, moodLogs, habits };
  },
});

export const recordAiTip = internalMutation({
  args: {
    userId: v.id('users'),
    summary: v.string(),
    model: v.string(),
    safetyPassed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('insights', {
      ...args,
      kind: 'adulting_tip',
      generatedAt: Date.now(),
    });
  },
});

/**
 * Internal action — generate one personalized adulting tip for a user,
 * keyed on focusCategories × recent mood trend × active habit count.
 * Scaffold: this is wired up end-to-end but only runs when CLAUDE_API_KEY
 * is set. Safety filter runs the same UNSAFE_KEYWORDS check as weekly reports.
 */
export const generatePersonalizedForUser = internalAction({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<void> => {
    const data: {
      user: { focusCategories?: string[]; currentStreak?: number; locale?: string } | null;
      moodLogs: { mood: number }[];
      habits: { category: string; name: string }[];
    } = await ctx.runQuery(internal.adultingTips.gatherForAiTip, { userId });

    if (!data.user) return;
    const focus = data.user.focusCategories ?? [];
    if (focus.length === 0) return;

    const avgMood =
      data.moodLogs.length > 0
        ? data.moodLogs.reduce((a, m) => a + m.mood, 0) / data.moodLogs.length
        : null;

    const prompt = [
      `Obszary focus użytkownika: ${focus.join(', ')}`,
      `Liczba aktywnych nawyków: ${data.habits.length}`,
      avgMood != null ? `Średni nastrój (14 dni): ${avgMood.toFixed(1)}/10` : 'Brak wpisów nastroju',
      `Streak: ${data.user.currentStreak ?? 0}`,
      '',
      'Napisz jedną, konkretną wskazówkę zgodną z formatem.',
    ].join('\n');

    try {
      const response = await callOpenAi({
        system: AI_TIP_SYSTEM,
        userPrompt: prompt,
        maxTokens: 220,
        locale: data.user.locale,
      });
      await ctx.runMutation(internal.adultingTips.recordAiTip, {
        userId,
        summary: response.text.slice(0, 320),
        model: response.model,
        safetyPassed: response.safetyPassed,
      });
    } catch (err) {
      console.warn('[adultingTips] openai call failed', String(err));
    }
  },
});

/**
 * Fan-out: run once per user who has focus set. Called by weekly cron.
 */
export const generatePersonalizedForAll = internalAction({
  args: {},
  handler: async (ctx): Promise<{ queued: number }> => {
    const userIds: Id<'users'>[] = await ctx.runQuery(
      internal.adultingTips.listUsersWithFocus,
      {},
    );
    for (const userId of userIds) {
      await ctx.runAction(internal.adultingTips.generatePersonalizedForUser, { userId });
    }
    return { queued: userIds.length };
  },
});

export const listUsersWithFocus = internalQuery({
  args: {},
  handler: async (ctx): Promise<Id<'users'>[]> => {
    const users = await ctx.db.query('users').collect();
    return users
      .filter((u) => 'focusCategories' in u && (u.focusCategories as string[] | undefined)?.length)
      .map((u) => u._id);
  },
});

/**
 * Public action — lets the signed-in user generate a fresh AI tip on demand
 * (e.g. "Refresh tip" button). Rate-limited to one generation per 6 hours
 * per user to avoid abuse and runaway OpenAI costs.
 */
const DEFAULT_COOLDOWN_MINUTES = 360; // 6h in prod

function cooldownMs(): number {
  const override = process.env.AI_TIP_COOLDOWN_MINUTES;
  const minutes = override ? Number(override) : DEFAULT_COOLDOWN_MINUTES;
  return Math.max(0, Number.isFinite(minutes) ? minutes : DEFAULT_COOLDOWN_MINUTES) * 60 * 1000;
}

export const generateAiTipForMe = action({
  args: {},
  handler: async (ctx): Promise<{ status: 'generated' | 'cooldown' | 'no_focus' }> => {
    const userId = await ctx.runQuery(internal.adultingTips.getAuthedUserId, {});
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const recent = await ctx.runQuery(internal.adultingTips.getRecentAiTip, { userId });
    if (recent && Date.now() - recent.generatedAt < cooldownMs()) {
      return { status: 'cooldown' as const };
    }

    const focus = await ctx.runQuery(internal.adultingTips.getUserFocus, { userId });
    if (!focus || focus.length === 0) {
      return { status: 'no_focus' as const };
    }

    await ctx.runAction(internal.adultingTips.generatePersonalizedForUser, { userId });
    return { status: 'generated' as const };
  },
});

export const getAuthedUserId = internalQuery({
  args: {},
  handler: async (ctx): Promise<Id<'users'> | null> => {
    const userId = await getAuthUserId(ctx);
    return userId as Id<'users'> | null;
  },
});

export const getRecentAiTip = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query('insights')
      .withIndex('by_user_and_kind', (q) =>
        q.eq('userId', userId).eq('kind', 'adulting_tip'),
      )
      .order('desc')
      .first();
  },
});

export const getUserFocus = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return ('focusCategories' in user ? user.focusCategories : null) as string[] | null;
  },
});
