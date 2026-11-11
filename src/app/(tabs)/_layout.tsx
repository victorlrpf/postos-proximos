import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { LocalHeader } from '../../components/LocalHeader';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitle: () => <LocalHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Lista',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="gas"
        options={{
          title: 'Gás (GLP)',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" size={size} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
