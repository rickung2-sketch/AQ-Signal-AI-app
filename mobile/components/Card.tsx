import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hasGoldBorder?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  hasGoldBorder = false,
  onPress,
}) => {
  const containerStyle = [
    styles.card,
    hasGoldBorder && styles.goldBorder,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.innerContainer}>{children}</View>
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#262626',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginVertical: spacing.sm,
  },
  goldBorder: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  innerContainer: {
    width: '100%',
  },
});

export default Card;
