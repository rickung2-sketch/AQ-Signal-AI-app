import React, { useState } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Display, Subheading, Body, Label, GoldAccent } from '../../components/Typography';
import { useRouter } from 'expo-router';
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Session Terminated', 'No active operator session identified. Please authenticate.');
      router.push('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(user);
      Alert.alert('Activation Link Sent', 'A fresh validation protocol has been dispatched to your registered address.');
    } catch (error: any) {
      Alert.alert('Dispatch Throttled', 'The auth server throttled this transmission. Please wait 60 seconds before retrying.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      // Force reload user metadata to check if verified
      await user.reload();
      const updatedUser = auth.currentUser;
      
      if (updatedUser?.emailVerified) {
        Alert.alert('Access Cleared', 'Email verification established successfully! Opening your dashboard...', [
          { text: 'Acknowledge', onPress: () => router.push('/(main)') }
        ]);
      } else {
        Alert.alert('Pending Validation', 'Our registry reports this email is still unverified. Please check your activation links.');
      }
    } catch (err) {
      Alert.alert('Query Error', 'Failed to retrieve fresh credentials status.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/(auth)/login');
    } catch (error) {
      Alert.alert('Action Interrupted', 'Could not terminate the current auth token.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Display style={styles.title}>
          AQ <GoldAccent>SIGNAL</GoldAccent> AI
        </Display>
        <Subheading style={styles.subtitle}>VERIFICATION PROTOCOL</Subheading>
      </View>

      <Card hasGoldBorder style={styles.card}>
        <View style={styles.iconContainer}>
          <Mail size={40} color={colors.gold} />
        </View>

        <Body style={styles.cardTitle}>PENDING ACTIVATION</Body>
        <Body style={styles.description}>
          To keep the premium AQ Trade network secure, we require email validation. Please check the inbox of:
        </Body>
        
        <Label style={styles.emailText}>
          {auth.currentUser?.email || 'your registered email'}
        </Label>

        <Button
          title="Verify Activation"
          onPress={checkVerificationStatus}
          isLoading={loading}
          style={styles.button}
        />

        <View style={styles.optionsRow}>
          <TouchableOpacity onPress={handleResend} style={styles.optionButton}>
            <Body style={styles.optionText}>
              <GoldAccent>Resend Email</GoldAccent>
            </Body>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleLogout} style={styles.optionButton}>
            <Body style={styles.optionText}>Cancel & Exit</Body>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    backgroundColor: '#1E1E1E',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emailText: {
    textAlign: 'center',
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  optionButton: {
    padding: spacing.xs,
  },
  optionText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
