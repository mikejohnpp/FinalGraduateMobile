// Màn hình tạo bài viết — port ý tưởng từ web (CreatePostCard).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCreatePost } from '@/hooks/usePost';
import { useAppSelector } from '@/store/hooks';

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const { create, loading, error } = useCreatePost();
  const userId = useAppSelector((r) => r.user.userId);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!userId) return;
    const result = await create({ userId, content });
    if (result) {
      setContent('');
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Button variant="ghost" className="h-auto p-0" onPress={() => router.back()}>
            <Text className="text-muted-foreground">Huỷ</Text>
          </Button>
          <Text variant="large">Tạo bài viết</Text>
          <Button
            variant="ghost"
            className="h-auto p-0"
            disabled={loading || !content.trim()}
            onPress={handleSubmit}>
            <Text className="text-primary">{loading ? 'Đang đăng...' : 'Đăng'}</Text>
          </Button>
        </View>

        <View className="flex-1 px-4 py-3">
          <TextInput
            className="flex-1 text-base text-foreground"
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor="hsl(240, 3.8%, 46.1%)"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          {error && <Text className="text-sm text-destructive">{error}</Text>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
