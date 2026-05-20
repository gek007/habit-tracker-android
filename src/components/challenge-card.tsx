import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChallengeCardProps {
  name: string;
  description: string;
  daysRemaining: number;
  durationDays: number;
  progress: number; // 0-100
  habitCount: number;
  completedToday: number;
}

export function ChallengeCard({
  name,
  description,
  daysRemaining,
  durationDays,
  progress,
  habitCount,
  completedToday,
}: ChallengeCardProps) {
  const progressWidth = `${progress}%`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="trophy" size={20} color="#d4af37" />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabel}>
          <Text style={styles.labelText}>Progress</Text>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="fire" size={16} color="#ff6b35" />
          <Text style={styles.statText}>
            {daysRemaining}/{durationDays} days
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#22c55e" />
          <Text style={styles.statText}>
            {completedToday}/{habitCount} done
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#aaa',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4af3722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4af37',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0a0a0a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4af37',
    borderRadius: 3,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});
