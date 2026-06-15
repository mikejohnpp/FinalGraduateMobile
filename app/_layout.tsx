import '../global.css';

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useSession } from '@/hooks/useSession';

function RootNavigator() {
  const { hydrated, isLoggedIn } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isLoggedIn && !inAuthGroup) {
      // Chưa đăng nhập → về Login
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      // Đã đăng nhập mà còn ở màn auth → vào tabs
      router.replace('/(tabs)');
    }
  }, [hydrated, isLoggedIn, segments, router]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style="auto" />
        <PortalHost />
      </SafeAreaProvider>
    </Provider>
  );
}
