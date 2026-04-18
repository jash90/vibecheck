import '../../global.css';
import '@shared/lib/i18n';

import { useEffect } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  SafeAreaListener,
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { ConvexProvider } from '@shared/lib/convex/Provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    Uniwind.updateInsets(initialWindowMetrics?.insets ?? { top: 0, bottom: 0, left: 0, right: 0 });
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
          <KeyboardProvider>
            <ConvexProvider>
              <QueryClientProvider client={queryClient}>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="sign-in" />
                  <Stack.Screen name="age-gate" />
                  <Stack.Screen name="blocked" />
                  <Stack.Screen name="parent-consent" />
                  <Stack.Screen name="awaiting-parent" />
                  <Stack.Screen name="focus-picker" />
                  <Stack.Screen name="profile-setup" />
                  <Stack.Screen name="home" />
                  <Stack.Screen
                    name="mood-check-in"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="add-habit"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="add-friend"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="crisis-resources"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen name="challenges" />
                  <Stack.Screen name="challenge/[id]" />
                  <Stack.Screen
                    name="create-challenge"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="notification-settings"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="paywall"
                    options={{ presentation: 'modal' }}
                  />
                </Stack>
              </QueryClientProvider>
            </ConvexProvider>
          </KeyboardProvider>
        </SafeAreaListener>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
