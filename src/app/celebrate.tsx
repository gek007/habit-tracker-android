import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { playCelebrationSound } from '@/services/sounds';

export default function CelebrateScreen() {
  const router = useRouter();
  const [confetti, setConfetti] = useState<Array<{ id: number }>>([]);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playCelebrationSound();

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
      bounciness: 12,
    }).start();

    const particles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
    }));
    setConfetti(particles);
  }, [scaleAnim]);

  const handleContinue = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {confetti.map((particle) => (
          <ConfettiParticle key={particle.id} />
        ))}
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.trophy,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="trophy"
            size={120}
            color="#d4af37"
          />
        </Animated.View>

        <Text style={styles.title}>Challenge Completed! 🎉</Text>
        <Text style={styles.subtitle}>
          You've successfully completed this challenge. Keep up the amazing
          work!
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons
              name="fire"
              size={24}
              color="#ff6b35"
            />
            <Text style={styles.statText}>On Fire!</Text>
          </View>

          <View style={styles.statBox}>
            <MaterialCommunityIcons
              name="star"
              size={24}
              color="#d4af37"
            />
            <Text style={styles.statText}>Amazing!</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleContinue}
        >
          <Text style={styles.secondaryButtonText}>
            Share Your Achievement
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ConfettiParticle() {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const rotation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startX = Math.random() * 400 - 200;
    const startY = Math.random() * 600;
    const endX = startX + (Math.random() - 0.5) * 200;
    const endY = startY + Math.random() * 400;
    const duration = 2000 + Math.random() * 1000;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endX,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: endY,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 720,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, translateY, opacity, rotation]);

  const color = ['#d4af37', '#ff6b35', '#22c55e', '#3b82f6'][
    Math.floor(Math.random() * 4)
  ];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [
            { translateX },
            { translateY },
            {
              rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.particleDot,
          {
            backgroundColor: color,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  trophy: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  button: {
    width: '100%',
    backgroundColor: '#d4af37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  particleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#d4af37',
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
});
