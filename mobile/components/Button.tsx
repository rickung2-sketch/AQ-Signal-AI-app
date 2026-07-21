import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isBtnDisabled = disabled || isLoading;

  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    isBtnDisabled && styles.disabled,
    style,
  ];

  const titleStyles = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
    isBtnDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isBtnDisabled}
        style={({ pressed }) => [
          buttonStyles,
          pressed && !isBtnDisabled && styles.pressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.background : colors.gold}
            size="small"
          />
        ) : (
          <Text style={titleStyles}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.gold,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  disabled: {
    backgroundColor: '#333333',
    borderColor: '#333333',
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  outlineText: {
    color: colors.gold,
  },
  disabledText: {
    color: colors.textMuted,
  },
});

export default Button;
