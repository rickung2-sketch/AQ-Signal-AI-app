import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Trophy, ShieldAlert, Settings, Compass, BookOpen } from 'lucide-react-native';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../../services/notifications';
import { apiService } from '../../services/apiService';
import { useQueryClient } from '@tanstack/react-query';

export default function MainLayout() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Ask permission and obtain the unique push token
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        apiService.registerDevice(token, Platform.OS)
          .then(() => console.log('[Notifications Layout] Device push token registered on backend.'))
          .catch((err) => console.error('[Notifications Layout] Device token backend registration failed:', err));
      }
    });

    // 2. Attach Foreground/Background notification listeners for low-latency Smart Refresh
    const unsubscribe = setupNotificationListeners(
      (notification) => {
        console.log('[Notifications Layout] Foreground notification received. Invalidation of signal query initiated.');
        // Smart Refresh: Notification Refresh trigger
        queryClient.invalidateQueries({ queryKey: ['signals'] });
        queryClient.invalidateQueries({ queryKey: ['guardian-status'] });
      },
      (response) => {
        console.log('[Notifications Layout] Interaction with notification detected. Invalidating queries.');
        queryClient.invalidateQueries({ queryKey: ['signals'] });
        queryClient.invalidateQueries({ queryKey: ['guardian-status'] });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: '#222222',
        },
        headerTintColor: colors.gold,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: 1,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: '#222222',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          headerTitle: 'ACTIVE TRANSMISSIONS',
          tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarLabel: 'Analysis',
          headerTitle: 'MARKET INTELLIGENCE',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarLabel: 'Ledger',
          headerTitle: 'AQ LEDGER ARCHIVE',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          headerTitle: 'SECURITY PANEL',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
