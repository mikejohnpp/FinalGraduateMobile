import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-6 gap-8">
        {/* Header */}
        <View className="gap-2">
          <Text variant="h2" className="border-b-0">
            Component Demo
          </Text>
          <Text variant="muted">React Native Reusables (shadcn/ui)</Text>
        </View>

        {/* Button Variants */}
        <View className="gap-3">
          <Text variant="h4">Button Variants</Text>

          <Button onPress={() => Alert.alert('Default', 'Button pressed!')}>
            <Text>Default</Text>
          </Button>

          <Button variant="secondary">
            <Text>Secondary</Text>
          </Button>

          <Button variant="destructive">
            <Text>Destructive</Text>
          </Button>

          <Button variant="outline">
            <Text>Outline</Text>
          </Button>

          <Button variant="ghost">
            <Text>Ghost</Text>
          </Button>

          <Button variant="link">
            <Text>Link</Text>
          </Button>
        </View>

        {/* Button Sizes */}
        <View className="gap-3">
          <Text variant="h4">Button Sizes</Text>

          <Button size="sm">
            <Text>Small</Text>
          </Button>

          <Button size="default">
            <Text>Default</Text>
          </Button>

          <Button size="lg">
            <Text>Large</Text>
          </Button>
        </View>

        {/* Text Variants */}
        <View className="gap-3">
          <Text variant="h4">Text Variants</Text>
          <Text variant="h1">Heading 1</Text>
          <Text variant="h3">Heading 3</Text>
          <Text variant="p">This is a paragraph text variant.</Text>
          <Text variant="lead">Lead text — larger and muted.</Text>
          <Text variant="large">Large text</Text>
          <Text variant="small">Small text</Text>
          <Text variant="muted">Muted text</Text>
          <Text variant="code">inline code</Text>
        </View>

        {/* Disabled State */}
        <View className="gap-3">
          <Text variant="h4">Disabled State</Text>
          <Button disabled>
            <Text>Disabled Button</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
