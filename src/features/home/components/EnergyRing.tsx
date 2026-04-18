import * as React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { useTranslation } from 'react-i18next';

interface EnergyRingProps {
  mentalScore: number; // 0..1
  physicalScore: number; // 0..1
  consistencyScore: number; // 0..1
  size?: number;
}

const STROKE_WIDTH = 10;
const GAP = 4;

export function EnergyRing({
  mentalScore,
  physicalScore,
  consistencyScore,
  size = 180,
}: EnergyRingProps) {
  const { t } = useTranslation();
  const primary = (useCSSVariable('--color-primary') as string | undefined) ?? '#8b5cf6';
  const accent = (useCSSVariable('--color-accent') as string | undefined) ?? '#ec4899';
  const flame = (useCSSVariable('--color-flame') as string | undefined) ?? '#f97316';
  const border = (useCSSVariable('--color-border') as string | undefined) ?? '#1f2937';

  const rings = [
    { r: size / 2 - STROKE_WIDTH / 2, color: primary, score: mentalScore, label: 'home.ringMental' },
    {
      r: size / 2 - STROKE_WIDTH * 1.5 - GAP,
      color: accent,
      score: physicalScore,
      label: 'home.ringPhysical',
    },
    {
      r: size / 2 - STROKE_WIDTH * 2.5 - GAP * 2,
      color: flame,
      score: consistencyScore,
      label: 'home.ringConsistency',
    },
  ];

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {rings.map((ring) => {
          const circumference = 2 * Math.PI * ring.r;
          const dashOffset = circumference * (1 - Math.max(0, Math.min(1, ring.score)));
          return (
            <React.Fragment key={ring.label}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={ring.r}
                stroke={border}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                opacity={0.3}
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={ring.r}
                stroke={ring.color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      <View className="flex-row gap-4 mt-4">
        {rings.map((ring) => (
          <View key={ring.label} className="items-center">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ring.color }}
            />
            <Text className="text-xs text-foreground-secondary mt-1">{t(ring.label)}</Text>
            <Text className="text-sm font-semibold text-foreground">
              {Math.round(ring.score * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
