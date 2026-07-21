import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Display, Subheading, Body, Label, GoldAccent } from './Typography';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Elegant luxury entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out after 2.5s
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, onAnimationComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[
        styles.logoContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}>
        {/* Styled Logo Crest */}
        <View style={styles.crestContainer}>
          <View style={styles.crestInner}>
            <Display style={styles.logoText}>AQ</Display>
          </View>
        </View>

        <Display style={styles.title}>
          AQ <GoldAccent>SIGNAL</GoldAccent> AI
        </Display>
        
        <Subheading style={styles.tagline}>
          INTELLIGENCE BEFORE EXECUTION
        </Subheading>
      </Animated.View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.gold} size="small" />
        <Label style={styles.loadingText}>SECURE HANDSHAKE INITIALIZING</Label>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestContainer: {
    width: 90,
    height: 90,
    borderWidth: 2,
    borderColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    backgroundColor: '#050505',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  crestInner: {
    transform: [{ rotate: '-45deg' }],
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '800',
    fontStyle: 'italic',
  },
  tagline: {
    marginTop: spacing.md,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 8,
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
});
