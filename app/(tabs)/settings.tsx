import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-6 p-6">
        <View className="gap-2">
          <Text variant="h2" className="border-b-0">
            Settings
          </Text>
          <Text variant="muted">App preferences and configuration</Text>
        </View>

        {/* Settings items */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
            <View className="gap-1">
              <Text variant="large">Notifications</Text>
              <Text variant="muted">Enable push notifications</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
            <View className="gap-1">
              <Text variant="large">Dark Mode</Text>
              <Text variant="muted">Toggle dark theme</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
            <View className="gap-1">
              <Text variant="large">Language</Text>
              <Text variant="muted">Tiếng Việt</Text>
            </View>
          </View>
        </View>

        <View className="mt-4">
          <Button variant="destructive">
            <Text>Sign Out</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
