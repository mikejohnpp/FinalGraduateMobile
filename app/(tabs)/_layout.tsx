import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'hsl(240, 5.9%, 10%)',
        tabBarInactiveTintColor: 'hsl(240, 3.8%, 46.1%)',
        tabBarStyle: {
          borderTopColor: 'hsl(240, 5.9%, 90%)',
        },
        // Khi ẩn label, căn icon vào giữa theo chiều dọc.
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          flex: 1,
          alignSelf: 'center',
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Bảng tin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Bạn bè',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Nhóm',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Các màn truy cập từ header bảng tin — ẩn khỏi tab bar */}
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      {/* Ẩn màn demo cũ khỏi tab bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
