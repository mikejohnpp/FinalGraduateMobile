import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-6 gap-6">
        <View className="gap-2">
          <Text variant="h2" className="border-b-0">
            Explore
          </Text>
          <Text variant="muted">Discover features and content</Text>
        </View>

        <View className="rounded-lg border border-border bg-card p-4 gap-2">
          <Text variant="large">Feature 1</Text>
          <Text variant="muted">
            This is a placeholder card. Replace with your actual explore content.
          </Text>
        </View>

        <View className="rounded-lg border border-border bg-card p-4 gap-2">
          <Text variant="large">Feature 2</Text>
          <Text variant="muted">
            Another placeholder card showing the card styling with shadcn CSS variables.
          </Text>
        </View>

        <View className="rounded-lg border border-border bg-card p-4 gap-2">
          <Text variant="large">Feature 3</Text>
          <Text variant="muted">
            File-based routing makes adding new screens simple — just create a file.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
