import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { generateCoachingNudge, generateSummary, fetchLatestInsights, AiInsight } from '@/services/ai-coaching';

export default function CoachScreen() {
  const [coaching, setCoaching] = useState<AiInsight | null>(null);
  const [summary, setSummary] = useState<AiInsight | null>(null);
  const [loadingNudge, setLoadingNudge] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'weekly' | 'monthly'>('weekly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCachedInsights();
  }, []);

  const loadCachedInsights = async () => {
    try {
      const insights = await fetchLatestInsights();
      if (insights.coaching) setCoaching(insights.coaching);
      if (insights.weekly) {
        setSummary(insights.weekly);
        setActiveSummaryTab('weekly');
      } else if (insights.monthly) {
        setSummary(insights.monthly);
        setActiveSummaryTab('monthly');
      }
    } catch (err: any) {
      console.error('[coach] Failed to load cached insights:', err);
    }
  };

  const handleRefreshNudge = async () => {
    setLoadingNudge(true);
    setError(null);
    try {
      const insight = await generateCoachingNudge();
      setCoaching(insight);
    } catch (err: any) {
      setError(err.message || 'Failed to generate coaching nudge');
      Alert.alert('Error', err.message || 'Failed to generate coaching nudge');
    } finally {
      setLoadingNudge(false);
    }
  };

  const handleGenerateSummary = async (period: 'weekly' | 'monthly') => {
    setLoadingSummary(true);
    setError(null);
    try {
      const insight = await generateSummary(period);
      setSummary(insight);
      setActiveSummaryTab(period);
    } catch (err: any) {
      setError(err.message || `Failed to generate ${period} summary`);
      Alert.alert('Error', err.message || `Failed to generate ${period} summary`);
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPeriodLabel = () => {
    if (!summary) return '';
    const start = summary.period_start ? formatDate(summary.period_start) : '';
    const end = summary.period_end ? formatDate(summary.period_end) : '';
    return `${start} – ${end}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="robot-outline" size={32} color="#d4af37" />
          <Text style={styles.headerTitle}>AI Coach</Text>
        </View>

        {/* Daily Nudge Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAILY NUDGE</Text>

          {loadingNudge ? (
            <View style={[styles.card, styles.centerContent]}>
              <ActivityIndicator size="large" color="#d4af37" />
            </View>
          ) : coaching ? (
            <View style={styles.card}>
              <Text style={styles.nudgeText}>{coaching.content}</Text>
              <Text style={styles.timestamp}>
                Generated {formatDate(coaching.generated_at)}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshNudge}
                disabled={loadingNudge}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#d4af37" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, styles.centerContent]}>
              <Text style={styles.emptyText}>Tap Refresh to get your daily coaching nudge</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRefreshNudge}
                disabled={loadingNudge}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#0a0a0a" />
                <Text style={styles.primaryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Reflection Summaries Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REFLECTION SUMMARIES</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.summaryButton,
                activeSummaryTab === 'weekly' && styles.summaryButtonActive,
              ]}
              onPress={() => handleGenerateSummary('weekly')}
              disabled={loadingSummary}
            >
              <MaterialCommunityIcons
                name="calendar-week"
                size={18}
                color={activeSummaryTab === 'weekly' ? '#0a0a0a' : '#d4af37'}
              />
              <Text
                style={[
                  styles.summaryButtonText,
                  activeSummaryTab === 'weekly' && styles.summaryButtonTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryButton,
                activeSummaryTab === 'monthly' && styles.summaryButtonActive,
              ]}
              onPress={() => handleGenerateSummary('monthly')}
              disabled={loadingSummary}
            >
              <MaterialCommunityIcons
                name="calendar-month"
                size={18}
                color={activeSummaryTab === 'monthly' ? '#0a0a0a' : '#d4af37'}
              />
              <Text
                style={[
                  styles.summaryButtonText,
                  activeSummaryTab === 'monthly' && styles.summaryButtonTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          {loadingSummary ? (
            <View style={[styles.card, styles.centerContent]}>
              <ActivityIndicator size="large" color="#d4af37" />
            </View>
          ) : summary ? (
            <View style={styles.card}>
              <Text style={styles.summaryText}>{summary.content}</Text>
              <Text style={styles.timestamp}>{getPeriodLabel()}</Text>
            </View>
          ) : (
            <View style={[styles.card, styles.centerContent]}>
              <Text style={styles.emptyText}>Generate a summary to see your reflection</Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  nudgeText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#fff',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4af37',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d4af37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4af3722',
    backgroundColor: 'transparent',
  },
  summaryButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  summaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
  },
  summaryButtonTextActive: {
    color: '#0a0a0a',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ff6b6b22',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    flex: 1,
  },
});
