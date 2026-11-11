import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { StationsProvider } from '../context/StationsContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <StationsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="posto/[id]" options={{ title: 'Detalhes do posto' }} />
        <Stack.Screen name="cidade" options={{ presentation: 'modal', title: 'Trocar cidade' }} />
      </Stack>
    </StationsProvider>
  );
}
