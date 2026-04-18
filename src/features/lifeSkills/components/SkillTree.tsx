import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@shared/ui/Card';
import { cn } from '@shared/lib/cn';

const SKILL_META: Record<string, { icon: string; nameKey: string; descriptionKey: string }> = {
  sleep_mastery: {
    icon: '😴',
    nameKey: 'skill.sleepMastery.name',
    descriptionKey: 'skill.sleepMastery.description',
  },
  physical_resilience: {
    icon: '💪',
    nameKey: 'skill.physicalResilience.name',
    descriptionKey: 'skill.physicalResilience.description',
  },
  emotional_intelligence: {
    icon: '🧠',
    nameKey: 'skill.emotionalIntelligence.name',
    descriptionKey: 'skill.emotionalIntelligence.description',
  },
  body_awareness: {
    icon: '🌿',
    nameKey: 'skill.bodyAwareness.name',
    descriptionKey: 'skill.bodyAwareness.description',
  },
  discipline: {
    icon: '🎯',
    nameKey: 'skill.discipline.name',
    descriptionKey: 'skill.discipline.description',
  },
};

interface SkillTreeProps {
  skills: { skill: string; xp: number; level: number }[];
}

export function SkillTree({ skills }: SkillTreeProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <Text className="text-lg font-bold text-foreground mb-3">{t('progress.skillsTitle')}</Text>
      <View className="gap-4">
        {skills.map((skill) => {
          const meta = SKILL_META[skill.skill];
          if (!meta) return null;
          return (
            <View key={skill.skill} className="flex-row items-center gap-3">
              <Text className="text-3xl">{meta.icon}</Text>
              <View className="flex-1 gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">
                    {t(meta.nameKey)}
                  </Text>
                  <Text className="text-xs text-foreground-secondary">
                    {t('progress.skillLevel', { level: skill.level })}
                  </Text>
                </View>
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((tier) => (
                    <View
                      key={tier}
                      className={cn(
                        'flex-1 h-2 rounded-pill',
                        tier <= skill.level ? 'bg-primary' : 'bg-border',
                      )}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
