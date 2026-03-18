import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          tabBarIcon: ({ color }) => (
            <Ionicons name="location" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calc',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calculator" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cooking"
        options={{
          title: 'Cook',
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Remind',
          tabBarIcon: ({ color }) => (
            <Ionicons name="alarm" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A24',
    borderTopColor: '#2D2D3D',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 25 : 4,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '500',
  },
});
