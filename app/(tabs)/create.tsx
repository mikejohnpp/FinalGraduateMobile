// Màn hình tạo bài viết — port ý tưởng từ web (CreatePostCard).
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import MediaDraftPicker from '@/components/MediaDraftPicker';
import { useCreatePost } from '@/hooks/usePost';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useAppSelector } from '@/store/hooks';
import { useThemeColors } from '@/hooks/useTheme';

export default function CreatePostScreen() {
  const colors = useThemeColors();
  const [content, setContent] = useState('');
  const { create, loading, error } = useCreatePost();
  const { drafts, uploading, hasMedia, pickAndAdd, removeDraft, clear, upload } = useMediaUpload();
  const userId = useAppSelector((r) => r.user.userId);
  const router = useRouter();

  const busy = loading || uploading;
  const canSubmit = (content.trim().length > 0 || hasMedia) && !busy;

  const handleSubmit = async () => {
    if (!userId || !canSubmit) return;

    // Upload media lên Supabase trước, lấy URL rồi đính vào body.
    const media = await upload();
    if (media === null) return; // upload lỗi (Alert đã hiển thị trong hook)

    const result = await create({
      userId,
      content,
      ...(media.length > 0 ? { media } : {}),
    });
    if (result) {
      setContent('');
      clear();
      if (result.status === 'PENDING') {
        Alert.alert('Đã gửi', 'Bài viết của bạn đang chờ phê duyệt.');
      }
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
            disabled={!canSubmit}
            onPress={handleSubmit}>
            <Text className="text-primary">
              {uploading ? 'Đang tải...' : loading ? 'Đang đăng...' : 'Đăng'}
            </Text>
          </Button>
        </View>

        <ScrollView
          contentContainerClassName="flex-grow px-4 py-3 gap-3"
          keyboardShouldPersistTaps="handled">
          <TextInput
            className="min-h-[120px] text-base text-foreground"
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus
            editable={!busy}
          />

          <MediaDraftPicker
            drafts={drafts}
            onPick={pickAndAdd}
            onRemove={removeDraft}
            disabled={busy}
          />

          {error && <Text className="text-sm text-destructive">{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
