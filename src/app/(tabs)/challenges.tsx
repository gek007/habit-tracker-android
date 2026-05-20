import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitsContext } from '@/context/habits-context';
import { ChallengeCard } from '@/components/challenge-card';

export default function ChallengesScreen() {
  const router = useRouter();
  const { challenges, habits, getChallengeProgress, getDaysRemaining, getHabitEntry, claimReward } =
    useHabitsContext();
  const [today] = React.useState(new Date().toISOString().split('T')[0]);

  const activeChallenge = useMemo(
    () => challenges.find((c) => !c.completed),
    [challenges]
  );

  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.completed),
    [challenges]
  );

  const getCompletedTodayCount = (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return 0;

    return challenge.habitIds.filter(
      (habitId) => getHabitEntry(habitId, today) >= 1
    ).length;
  };

  const handleChallengeComplete = async (challengeId: string) => {
    try {
      await claimReward(challengeId);
      router.push('/celebrate');
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
      </View>

      <FlatList
        data={activeChallenge ? [activeChallenge, ...completedChallenges] : completedChallenges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const progress = getChallengeProgress(item.id, {});
          const daysRemaining = getDaysRemaining(item.id);
          const completedToday = getCompletedTodayCount(item.id);

          return (
            <View style={styles.cardWrapper}>
              <ChallengeCard
                name={item.name}
                description={item.description}
                daysRemaining={Math.max(0, daysRemaining)}
                durationDays={item.durationDays}
                progress={progress}
                habitCount={item.habitIds.length}
                completedToday={completedToday}
              />

              {item.completed && !item.rewardClaimed && (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleChallengeComplete(item.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="gift"
                    size={20}
                    color="#0a0a0a"
                  />
                  <Text style={styles.claimButtonText}>Claim Reward</Text>
                </TouchableOpacity>
              )}

              {item.rewardClaimed && (
                <View style={styles.claimedBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color="#22c55e"
                  />
                  <Text style={styles.claimedText}>Reward Claimed</Text>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="trophy"
              size={64}
              color="#d4af37"
            />
            <Text style={styles.emptyText}>No challenges yet</Text>
            <Text style={styles.emptySubtext}>
              Complete your habits to create your first challenge
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  cardWrapper: {
    marginVertical: 8,
  },
  claimButton: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  claimedBadge: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#22c55e22',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  claimedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
});
