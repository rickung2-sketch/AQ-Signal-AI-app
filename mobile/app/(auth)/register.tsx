import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Display, Subheading, Body, Label, GoldAccent } from '../../components/Typography';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Registration Blocked', 'Please complete all credentials interfaces.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Security Validation Failed', 'The passwords entered in both secure fields do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Security Deficient', 'Passcode must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Set display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
        
        // 3. Send verification email (Required in specs)
        try {
          await sendEmailVerification(userCredential.user);
          Alert.alert(
            'Verification Required',
            'Registration successful! A secure activation email has been dispatched to your address. Please verify your inbox.',
            [{ text: 'Acknowledge', onPress: () => router.push('/(auth)/verify-email') }]
          );
        } catch (err) {
          console.error('[Verification Email] dispatch failed:', err);
          Alert.alert('Session Synchronized', 'Registration successful. Verification transmission failed, please trigger manually.');
        }
      }
    } catch (error: any) {
      let friendlyError = 'Registration rejected by Auth Server. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        friendlyError = 'This operator email address is already registered inside our network.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyError = 'Email address formatting error detected.';
      }
      Alert.alert('Registration Refused', friendlyError);
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
          <Subheading style={styles.subtitle}>CREATE TERMINAL COMPANION</Subheading>
        </View>

        <Card hasGoldBorder style={styles.card}>
          <Body style={styles.cardTitle}>REGISTER OPERATOR CREDENTIALS</Body>

          <View style={styles.inputContainer}>
            <Label style={styles.inputLabel}>OPERATOR DISPLAY NAME</Label>
            <TextInput
              style={styles.input}
              placeholder="Alex Mercer"
              placeholderTextColor="#555"
              autoCapitalize="words"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Label style={styles.inputLabel}>SECURE EMAIL INTERFACE</Label>
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

          <View style={styles.inputContainer}>
            <Label style={styles.inputLabel}>SECURITY PASSCODE</Label>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••••"
              placeholderTextColor="#555"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Label style={styles.inputLabel}>CONFIRM PASSCODE</Label>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••••"
              placeholderTextColor="#555"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Button
            title="Register Account"
            onPress={handleRegister}
            isLoading={loading}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.switchButton}>
            <Body style={styles.switchText}>
              Already registered? <GoldAccent>Access Terminal</GoldAccent>
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
    marginBottom: spacing.lg,
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
    marginTop: spacing.sm,
  },
  cardTitle: {
    textAlign: 'center',
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
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
