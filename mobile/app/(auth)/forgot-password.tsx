import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Display, Subheading, Body, Label, GoldAccent } from '../../components/Typography';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Missing Identity', 'Please enter your registered operator email to initialize reset protocol.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'Reset Dispatched',
        'If an operator account exists under this email address, a secure recovery code & link has been dispatched.',
        [{ text: 'Acknowledge', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error: any) {
      let friendlyError = 'The reset transmission was rejected. Please review your email format.';
      if (error.code === 'auth/invalid-email') {
        friendlyError = 'Email address formatting error detected.';
      }
      Alert.alert('Reset Refused', friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Display style={styles.title}>
            AQ <GoldAccent>SIGNAL</GoldAccent> AI
          </Display>
          <Subheading style={styles.subtitle}>PASSCODE RECOVERY INTERFACE</Subheading>
        </View>

        <Card hasGoldBorder style={styles.card}>
          <Body style={styles.cardTitle}>INITIALIZE RECOVERY PROTOCOL</Body>

          <View style={styles.inputContainer}>
            <Label style={styles.inputLabel}>OPERATOR EMAIL ADDRESS</Label>
            <TextInput
              style={styles.input}
              placeholder="operator@aqtradeai.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Button
            title="Dispatch Reset Link"
            onPress={handleResetPassword}
            isLoading={loading}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.switchButton}>
            <Body style={styles.switchText}>
              Back to <GoldAccent>Authentication Screen</GoldAccent>
            </Body>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  card: {
    marginTop: spacing.md,
  },
  cardTitle: {
    textAlign: 'center',
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    fontSize: 9,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0A0A0A',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    height: 50,
    color: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  button: {
    marginTop: spacing.md,
  },
  switchButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
