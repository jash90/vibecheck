import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { habitCategoryMatchesFocus } from '@shared/constants/focus';

import { HabitLogRow } from './HabitLogRow';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const XP_BADGE_DURATION_MS = 1400;

export function DailyCard() {
  const { t } = useTranslation();
  const today = todayISO();
  const habits = useQuery(api.habits.listMine);
  const logs = useQuery(api.habitLogs.listForDate, { localDate: today });
  const me = useQuery(api.users.me);
  const logCompletion = useMutation(api.habitLogs.logCompletion);
  const [xpBadge, setXpBadge] = useState<{
    habitId: string;
    xp: number;
    leveledUp: boolean;
    identityStatement: string | null;
    token: number;
  } | null>(null);

  const sortedHabits = useMemo(() => {
    if (!habits) return habits;
    const focus = me?.focusCategories ?? [];
    const byParent = new Map<string, typeof habits>();
    for (const h of habits) {
      if (!h.stackedAfterHabitId) continue;
      const bucket = byParent.get(h.stackedAfterHabitId) ?? [];
      bucket.push(h);
      byParent.set(h.stackedAfterHabitId, bucket);
    }

    const roots = habits.filter((h) => !h.stackedAfterHabitId);
    const rootOrder = [...roots].sort((a, b) => {
      const aMatches = habitCategoryMatchesFocus(a.category, focus) ? 0 : 1;
      const bMatches = habitCategoryMatchesFocus(b.category, focus) ? 0 : 1;
      if (aMatches !== bMatches) return aMatches - bMatches;
      return a.createdAt - b.createdAt;
    });

    const flattened: { habit: (typeof habits)[number]; isStacked: boolean }[] = [];
    for (const root of rootOrder) {
      flattened.push({ habit: root, isStacked: false });
      const children = byParent.get(root._id) ?? [];
      for (const child of children.sort((a, b) => a.createdAt - b.createdAt)) {
        flattened.push({ habit: child, isStacked: true });
      }
    }
    return flattened;
  }, [habits, me?.focusCategories]);

  if (habits === undefined || logs === undefined || sortedHabits === undefined) {
    return (
      <Card>
        <Text className="text-base text-foreground-secondary">{t('common.loading')}</Text>
      </Card>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <Text className="text-base text-foreground-secondary text-center py-4">
          {t('home.emptyHabits')}
        </Text>
      </Card>
    );
  }

  const doneHabitIds = new Set(logs.map((l) => l.habitId));
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();
  const allDone = habits.every((h) => doneHabitIds.has(h._id));

  async function runLog(habitId: string, asMinimum: boolean) {
    try {
      const result = await logCompletion({
        habitId: habitId as never,
        localDate: today,
        timezoneOffsetMinutes,
        isMinimumVersion: asMinimum,
      });
      if (!result.alreadyLogged && result.xp && result.xp.gained > 0) {
        const token = Date.now();
        const identityStatement =
          result.identityCategory && me?.identityStatements
            ? me.identityStatements[result.identityCategory] ?? null
            : null;
        setXpBadge({
          habitId,
          xp: result.xp.gained,
          leveledUp: result.xp.leveledUp,
          identityStatement,
          token,
        });
        setTimeout(() => {
          setXpBadge((current) => (current?.token === token ? null : current));
        }, XP_BADGE_DURATION_MS);
      }
    } catch {
      // mutation errors surface through existing auth/error flow
    }
  }

  function handleLog(habitId: string) {
    void runLog(habitId, false);
  }

  function handleLogMinimum(habitId: string) {
    const habit = habits?.find((h) => h._id === habitId);
    if (!habit || !habit.minimumVersion) return;
    Alert.alert(
      t('habits.minimumPromptTitle'),
      t('habits.minimumPromptBody', { version: habit.minimumVersion }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('habits.minimumConfirm'),
          onPress: () => void runLog(habitId, true),
        },
      ],
    );
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between gap-3 mb-3">
        <Text
          className="text-lg font-bold text-foreground flex-shrink"
          numberOfLines={1}
        >
          {t('home.dailyCardTitle')}
        </Text>
        {allDone ? (
          <Text
            className="text-sm font-semibold text-success flex-shrink-0"
            numberOfLines={1}
          >
            ✓ {t('home.allDone')}
          </Text>
        ) : null}
      </View>
      <View className="gap-2">
        {sortedHabits.map(({ habit, isStacked }) => {
          const isDone = doneHabitIds.has(habit._id);
          const badge =
            xpBadge?.habitId === habit._id
              ? {
                  xp: xpBadge.xp,
                  leveledUp: xpBadge.leveledUp,
                  identityStatement: xpBadge.identityStatement,
                }
              : null;
          return (
            <HabitLogRow
              key={habit._id}
              habitId={habit._id}
              name={habit.name}
              done={isDone}
              onLog={handleLog}
              onLogMinimum={handleLogMinimum}
              hasMinimumVersion={Boolean(habit.minimumVersion)}
              badge={badge}
              zenMode={me?.zenMode ?? false}
              isStacked={isStacked}
              cueContext={habit.cueContext ?? null}
            />
          );
        })}
      </View>
    </Card>
  );
}
