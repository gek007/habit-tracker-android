import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface VolumeCounterProps {
  current: number;
  goal: number;
  onIncrement: () => void;
  color?: string;
}

export function VolumeCounter({ current, goal, onIncrement, color = '#d4af37' }: VolumeCounterProps) {
  const progress = Math.min(current / goal, 1);
  const isComplete = current >= goal;

  return (
    <TouchableOpacity
      onPress={onIncrement}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={[styles.circle, { borderColor: color }]}>
        <View
          style={[
            styles.progressRing,
            {
              borderColor: color,
              opacity: progress > 0 ? 1 : 0.2,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              borderLeftColor: color,
              transform: [{ rotateZ: `${progress * 360}deg` }],
            },
          ]}
        />
        <View style={styles.content}>
          <Text style={[styles.count, { color }]}>
            {current}/{goal}
          </Text>
          {isComplete && (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={color}
              style={{ marginTop: 4 }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 3,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
  },
});
