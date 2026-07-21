import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { SplashScreen } from '../components/SplashScreen';

// Initialize React Query Client for application state orchestration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loginSuccess, logout, isLoading, setLoading } = useAuthStore();
  const [isSplashActive, setIsSplashActive] = useState(true);

  // Setup Firebase Auth listener to update Zustand store reactively
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch current JWT token safely
        const token = await firebaseUser.getIdToken();
        loginSuccess({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }, token);
      } else {
        logout();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [loginSuccess, logout, setLoading]);

  // Handle protected route redirection rules
  useEffect(() => {
    if (isLoading || isSplashActive) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Direct unauthenticated users straight to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Direct logged-in users straight to main signals dashboard
      router.replace('/(main)');
    }
  }, [isAuthenticated, segments, isLoading, isSplashActive, router]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={colors.background} />
        {isSplashActive ? (
          <SplashScreen onAnimationComplete={() => setIsSplashActive(false)} />
        ) : (
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.gold,
              headerTitleStyle: {
                fontWeight: '700',
              },
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
          </Stack>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
