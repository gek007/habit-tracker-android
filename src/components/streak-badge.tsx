import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StreakBadgeProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

export function StreakBadge({ streak, size = 'medium' }: StreakBadgeProps) {
  const sizeConfig = {
    small: { fontSize: 12, iconSize: 16, padding: 4 },
    medium: { fontSize: 14, iconSize: 18, padding: 6 },
    large: { fontSize: 16, iconSize: 20, padding: 8 },
  };

  const config = sizeConfig[size];

  if (streak === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: config.padding + 4,
          paddingVertical: config.padding,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="fire"
        size={config.iconSize}
        color="#ff6b35"
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.text, { fontSize: config.fontSize }]}>
        {streak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  text: {
    fontWeight: '700',
    color: '#ff6b35',
  },
});
