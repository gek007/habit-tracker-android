import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON_ALIASES: Record<string, string> = {
  sun: 'weather-sunny',
  moon: 'weather-night',
};

/** Normalize stored icon ids (e.g. legacy sun/moon) to valid MaterialCommunityIcons names. */
export function normalizeHabitIcon(icon: string): string {
  return ICON_ALIASES[icon] ?? icon;
}

export function resolveHabitIcon(icon: string): IconName {
  return normalizeHabitIcon(icon) as IconName;
}
