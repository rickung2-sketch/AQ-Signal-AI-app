import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withLoop,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { Monospace, Heading } from './Typography';

interface AQRingProps {
  score: number;
  direction?: 'BUY' | 'SELL';
}

export function AQRing({ score, direction = 'BUY' }: AQRingProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Elegant pulse on mount
    scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });

    // Ongoing slow rotation of scanner ring
    rotation.value = withLoop(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      })
    );
  }, []);

  const scannerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const activeColor = direction === 'BUY' ? '#4CAF50' : '#FF5252';

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Outer Glow Ring */}
      <View style={styles.outerRing}>
        {/* Animated Scanner Node */}
        <Animated.View style={[styles.scanner, scannerStyle]}>
          <View style={[styles.scannerDot, { backgroundColor: colors.gold }]} />
        </Animated.View>

        {/* Dynamic Color Segmented Inner Arc */}
        <View style={[styles.middleRing, { borderColor: `${colors.gold}22` }]}>
          <View style={[styles.activeSegment, { borderColor: colors.gold, borderTopColor: 'transparent', borderLeftColor: 'transparent' }]} />
        </View>

        {/* Solid Center Core */}
        <View style={styles.core}>
          <Heading style={styles.scoreText}>{score.toFixed(1)}</Heading>
          <Monospace style={styles.pctText}>% ACC</Monospace>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100,
  },
  outerRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#070707',
    // Golden shadow glow
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scanner: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  scannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  middleRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSegment: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  core: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1D1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    lineHeight: 20,
    textAlign: 'center',
  },
  pctText: {
    fontSize: 7,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.5,
    marginTop: -2,
  },
});
