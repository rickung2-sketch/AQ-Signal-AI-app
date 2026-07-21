import React from 'react';
import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/spacing';

interface TypographyProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  numberOfLines?: number;
}

export const Display: React.FC<TypographyProps> = ({ children, style, color = colors.textPrimary, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.display, { color }, style]}>
    {children}
  </Text>
);

export const Heading: React.FC<TypographyProps> = ({ children, style, color = colors.textPrimary, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.heading, { color }, style]}>
    {children}
  </Text>
);

export const Subheading: React.FC<TypographyProps> = ({ children, style, color = colors.textSecondary, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.subheading, { color }, style]}>
    {children}
  </Text>
);

export const Body: React.FC<TypographyProps> = ({ children, style, color = colors.textPrimary, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.body, { color }, style]}>
    {children}
  </Text>
);

export const Label: React.FC<TypographyProps> = ({ children, style, color = colors.textMuted, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.label, { color }, style]}>
    {children}
  </Text>
);

export const GoldAccent: React.FC<TypographyProps> = ({ children, style, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.goldAccent, style]}>
    {children}
  </Text>
);

export const Monospace: React.FC<TypographyProps> = ({ children, style, color = colors.textPrimary, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[styles.monospace, { color }, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  display: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.display,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  heading: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.2,
    lineHeight: 30,
  },
  subheading: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: 24,
  },
  body: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    lineHeight: 22,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  goldAccent: {
    color: colors.gold,
    fontWeight: typography.weights.bold,
  },
  monospace: {
    fontFamily: 'Platform-Mono', // Fallback styled in root configs
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: -0.2,
  },
});
