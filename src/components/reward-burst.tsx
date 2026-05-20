import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  angle: number;
  distance: number;
}

interface RewardBurstProps {
  onComplete?: () => void;
  size?: number;
}

export function RewardBurst({ onComplete, size = 80 }: RewardBurstProps) {
  const particles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    angle: (i / 12) * Math.PI * 2,
    distance: 150,
  }));

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          angle={particle.angle}
          distance={particle.distance}
          onComplete={handleComplete}
        />
      ))}
    </View>
  );
}

interface ParticleProps {
  angle: number;
  distance: number;
  onComplete: () => void;
}

function Particle({ angle, distance, onComplete }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;

    translateX.value = withTiming(endX, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    translateY.value = withTiming(endY, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    opacity.value = withTiming(0, {
      duration: 600,
      easing: Easing.in(Easing.cubic),
    }, () => {
      runOnJS(onComplete)();
    });

    scale.value = withTiming(0.1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [angle, distance, translateX, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#d4af37',
          shadowColor: '#d4af37',
          shadowOpacity: 0.8,
          shadowRadius: 4,
          elevation: 5,
        },
        animatedStyle,
      ]}
    />
  );
}
