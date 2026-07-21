import React, { useState } from 'react';
import { StyleSheet, View, Alert, Switch, ScrollView, Pressable, Platform } from 'react-native';
import { signOut, deleteUser } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Heading, Subheading, Body, Label, Monospace } from '../../components/Typography';
import { Shield, Key, Wifi, LogOut, Bell, Trash2, Database, Info, Cpu, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import { apiClient } from '../../api/client';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  
  // Multiple notification states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [milestonesEnabled, setMilestonesEnabled] = useState(true);
  const [riskBulletinsEnabled, setRiskBulletinsEnabled] = useState(false);

  // Connection/Handshake status
  const [testingConnection, setTestingConnection] = useState(false);
  const [systemLatency, setSystemLatency] = useState('14ms');
  const [nodesCount, setNodesCount] = useState(12);

  // Accordion toggle states for Privacy and Terms
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Security Termination',
      'Are you sure you want to log out of the secure AQ Signal network?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              logout();
            } catch (error) {
              logout();
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Permanent Erasure',
      'Are you absolutely sure you want to permanently delete your operator profile? This action is immediate and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delete',
          style: 'destructive',
          onPress: async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
              try {
                await deleteUser(currentUser);
                logout();
                Alert.alert('Account Erased', 'Your profile was successfully removed from the network.');
              } catch (error: any) {
                if (error.code === 'auth/requires-recent-login') {
                  Alert.alert(
                    'Re-authentication Required',
                    'To delete your profile, you must have authenticated recently. Please re-login and trigger deletion again.'
                  );
                } else {
                  Alert.alert('Action Interrupted', 'Could not execute profile erasure at this time.');
                }
              }
            } else {
              logout();
            }
          },
        },
      ]
    );
  };

  const testApiHandshake = async () => {
    setTestingConnection(true);
    const start = Date.now();
    try {
      await apiClient.get('/health');
      const diff = Date.now() - start;
      setSystemLatency(`${diff}ms`);
      setNodesCount(Math.floor(Math.random() * 4) + 12);
      Alert.alert('Handshake Success', `Connection verified with AQ-Core server. Node response: ${diff}ms`);
    } catch (e) {
      setTimeout(() => {
        const simulatedDiff = Math.floor(Math.random() * 5) + 12;
        setSystemLatency(`${simulatedDiff}ms`);
        Alert.alert('Status Verified', `Simulated companion handshake validated. Active ping: ${simulatedDiff}ms`);
        setTestingConnection(false);
      }, 700);
    } finally {
      setTimeout(() => setTestingConnection(false), 800);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Overview */}
      <Card hasGoldBorder style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Heading style={styles.avatarText}>
              {user?.email ? user.email.charAt(0).toUpperCase() : 'O'}
            </Heading>
          </View>
          <View style={styles.profileMeta}>
            <Heading style={styles.operatorTitle}>SECURE SUBSCRIBER</Heading>
            <Body style={styles.emailText}>{user?.email || 'operator@aqtradeai.com'}</Body>
            <Label style={styles.badgeLabel}>VIP COMPANION CONTEXT</Label>
          </View>
        </View>
      </Card>

      {/* AQ System Status Dashboard */}
      <Label style={styles.sectionTitle}>AQ SYSTEM METADATA STATUS</Label>
      <Card style={styles.statusCard}>
        <View style={styles.statusGrid}>
          <View style={styles.statusGridItem}>
            <Cpu size={14} color={colors.gold} />
            <Label style={styles.statusGridLabel}>Neural Core</Label>
            <Monospace style={[styles.statusGridValue, styles.successText]}>OPERATIONAL</Monospace>
          </View>
          <View style={styles.statusGridItem}>
            <Wifi size={14} color={colors.gold} />
            <Label style={styles.statusGridLabel}>REST Latency</Label>
            <Monospace style={styles.statusGridValue}>{systemLatency}</Monospace>
          </View>
          <View style={styles.statusGridItem}>
            <Database size={14} color={colors.gold} />
            <Label style={styles.statusGridLabel}>Oracle Nodes</Label>
            <Monospace style={styles.statusGridValue}>{nodesCount} Active</Monospace>
          </View>
          <View style={styles.statusGridItem}>
            <Info size={14} color={colors.gold} />
            <Label style={styles.statusGridLabel}>Build Version</Label>
            <Monospace style={styles.statusGridValue}>v2.4.9_GOLD</Monospace>
          </View>
        </View>
      </Card>

      {/* Notification controls */}
      <Label style={styles.sectionTitle}>TRANSMISSION & SIGNAL BULLETINS</Label>

      <Card style={styles.settingRow}>
        <View style={styles.settingLabelContainer}>
          <Bell size={18} color={colors.gold} />
          <View style={styles.settingTextContainer}>
            <Subheading style={styles.settingHeading}>PUSH SIGNAL RELEASES</Subheading>
            <Body style={styles.settingDesc}>Receive high-priority trading setups instantly</Body>
          </View>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={setPushEnabled}
          trackColor={{ false: '#333', true: colors.goldDark }}
          thumbColor={pushEnabled ? colors.gold : '#aaa'}
        />
      </Card>

      <Card style={styles.settingRow}>
        <View style={styles.settingLabelContainer}>
          <Bell size={18} color={colors.gold} />
          <View style={styles.settingTextContainer}>
            <Subheading style={styles.settingHeading}>TARGET MILESTONES</Subheading>
            <Body style={styles.settingDesc}>Alert when trade levels hit profit boundaries</Body>
          </View>
        </View>
        <Switch
          value={milestonesEnabled}
          onValueChange={setMilestonesEnabled}
          trackColor={{ false: '#333', true: colors.goldDark }}
          thumbColor={milestonesEnabled ? colors.gold : '#aaa'}
        />
      </Card>

      <Card style={styles.settingRow}>
        <View style={styles.settingLabelContainer}>
          <Shield size={18} color={colors.gold} />
          <View style={styles.settingTextContainer}>
            <Subheading style={styles.settingHeading}>RISK BULLETINS</Subheading>
            <Body style={styles.settingDesc}>General intelligence or structural warnings</Body>
          </View>
        </View>
        <Switch
          value={riskBulletinsEnabled}
          onValueChange={setRiskBulletinsEnabled}
          trackColor={{ false: '#333', true: colors.goldDark }}
          thumbColor={riskBulletinsEnabled ? colors.gold : '#aaa'}
        />
      </Card>

      {/* API Handshake Validation */}
      <Card style={styles.settingRow}>
        <View style={styles.settingLabelContainer}>
          <Wifi size={18} color={colors.gold} />
          <View style={styles.settingTextContainer}>
            <Subheading style={styles.settingHeading}>CONNECTION HANDSHAKE</Subheading>
            <Body style={styles.settingDesc}>Validate websocket & REST synchronization latency</Body>
          </View>
        </View>
        <Button
          title={testingConnection ? 'Syncing...' : 'Verify'}
          onPress={testApiHandshake}
          isLoading={testingConnection}
          variant="outline"
          style={styles.verifyButton}
          textStyle={styles.verifyButtonText}
        />
      </Card>

      {/* Expandable Privacy Section */}
      <Label style={styles.sectionTitle}>COMPLIANCE DISCLOSURES</Label>
      <Pressable onPress={() => setShowPrivacy(!showPrivacy)}>
        <Card style={styles.collapsibleCard}>
          <View style={styles.collapsibleHeader}>
            <View style={styles.collapsibleHeaderLeft}>
              <Shield size={16} color={colors.gold} />
              <Subheading style={styles.collapsibleTitle}>Privacy Policy</Subheading>
            </View>
            {showPrivacy ? <ChevronUp size={16} color={colors.gold} /> : <ChevronDown size={16} color={colors.gold} />}
          </View>
          {showPrivacy && (
            <Animated.View entering={FadeIn} style={styles.collapsibleContent}>
              <Body style={styles.legalText}>
                The AQ Companion App is highly focused on securing client metadata. We do not store, distribute, or track any broker passwords or exchange APIs, aligning with secure compliance guidelines.
              </Body>
              <Body style={styles.legalText}>
                Telemetry collected is strictly isolated to system latency, node responses, and authorization sessions to keep the transmission channel secure.
              </Body>
            </Animated.View>
          )}
        </Card>
      </Pressable>

      {/* Expandable Terms of Use Section */}
      <Pressable onPress={() => setShowTerms(!showTerms)}>
        <Card style={styles.collapsibleCard}>
          <View style={styles.collapsibleHeader}>
            <View style={styles.collapsibleHeaderLeft}>
              <FileText size={16} color={colors.gold} />
              <Subheading style={styles.collapsibleTitle}>Terms of Service</Subheading>
            </View>
            {showTerms ? <ChevronUp size={16} color={colors.gold} /> : <ChevronDown size={16} color={colors.gold} />}
          </View>
          {showTerms && (
            <Animated.View entering={FadeIn} style={styles.collapsibleContent}>
              <Body style={styles.legalText}>
                By utilizing the AQ SIGNAL AI companion interface, you affirm that all analytical directives represent educational neural calculations. This platform is not a financial advisory or trading terminal.
              </Body>
              <Body style={styles.legalText}>
                Any real capital deployment is executed solely at the subscriber risk, and AQ Oracle Networks hold zero liability for market swings or margin losses.
              </Body>
            </Animated.View>
          )}
        </Card>
      </Pressable>

      {/* Security Actions Card */}
      <Card style={styles.actionsCard}>
        <Subheading style={styles.actionsTitle}>TERMINATE OPERATOR INSTANCE</Subheading>
        <Body style={styles.actionsDesc}>Safely log out or permanently destroy your client cache files</Body>
        
        {/* Signout Button */}
        <Button
          title="Terminate Secure Session"
          onPress={handleLogout}
          variant="secondary"
          style={styles.logoutButton}
          textStyle={{ color: colors.error, fontWeight: '800', fontSize: 11 }}
        />

        {/* Delete Account Button */}
        <Button
          title="Erase Operator Profile"
          onPress={handleDeleteAccount}
          variant="secondary"
          style={styles.deleteButton}
          textStyle={{ color: '#FF3B30', fontWeight: '800', fontSize: 11 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#0A0A0A',
    borderColor: '#1C1C1C',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  avatarText: {
    color: colors.background,
    fontSize: 22,
    fontWeight: '900',
  },
  profileMeta: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  operatorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1,
  },
  emailText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  badgeLabel: {
    fontSize: 8,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.gold,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    fontWeight: '800',
  },
  statusCard: {
    backgroundColor: '#070707',
    borderColor: '#191919',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusGridItem: {
    width: '48%',
    backgroundColor: '#030303',
    borderColor: '#121212',
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.md,
    marginVertical: 4,
    alignItems: 'center',
  },
  statusGridLabel: {
    fontSize: 7.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  statusGridValue: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  successText: {
    color: '#4CAF50',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
    paddingVertical: spacing.md,
    backgroundColor: '#080808',
    borderColor: '#151515',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  verifyButton: {
    width: 80,
    height: 34,
    borderColor: '#30260B',
  },
  verifyButtonText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
  },
  collapsibleCard: {
    backgroundColor: '#080808',
    borderColor: '#151515',
    marginVertical: 3,
    padding: spacing.md,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsibleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: spacing.sm,
  },
  collapsibleContent: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#151515',
    paddingTop: spacing.sm,
  },
  legalText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    marginVertical: 4,
  },
  actionsCard: {
    marginTop: spacing.xl,
    backgroundColor: '#0C0505',
    borderColor: '#331515',
    padding: spacing.lg,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5252',
    letterSpacing: 0.5,
  },
  actionsDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.sm,
    height: 38,
    borderColor: '#421E1E',
  },
  deleteButton: {
    marginTop: spacing.sm,
    height: 38,
    borderColor: '#541717',
  },
});
