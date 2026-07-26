// Màn hình chi tiết bài viết + bình luận — port từ web (CommentModal).
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CommentItem } from '@/components/CommentItem';
import MediaDraftPicker from '@/components/MediaDraftPicker';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useComments, useCreateComment } from '@/hooks/useComment';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import type { IComment } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

export default function PostDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const router = useRouter();

  const { comments, loading, loadMore } = useComments(postId);
  const { create, loading: sending } = useCreateComment(postId);
  const { drafts, uploading, hasMedia, pickAndAdd, removeDraft, clear, upload } = useMediaUpload();

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<IComment | null>(null);

  const busy = sending || uploading;
  const canSend = (text.trim().length > 0 || hasMedia) && !busy;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const media = await upload();
    if (media === null) return; // upload lỗi (Alert đã hiển thị trong hook)
    const result = await create(text, replyTo?.id ?? null, media.length > 0 ? media : null);
    if (result) {
      setText('');
      setReplyTo(null);
      clear();
    }
  }, [canSend, upload, create, text, replyTo, clear]);

  const handleReply = useCallback((comment: IComment) => {
    setReplyTo(comment);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large">Bình luận</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CommentItem comment={item} postId={postId} onReply={handleReply} />
          )}
          ItemSeparatorComponent={() => <View className="h-4" />}
          contentContainerClassName="p-4"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading ? (
              <View className="mt-20 items-center">
                <Text variant="muted">Chưa có bình luận. Hãy là người đầu tiên!</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        {/* Composer */}
        <View className="border-t border-border px-4 py-2">
          {replyTo && (
            <View className="mb-1 flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                Đang phản hồi {replyTo.author.nickName || replyTo.author.name}
              </Text>

              <Button variant="link" className="h-auto p-0" onPress={() => setReplyTo(null)}>
                <Text className="text-xs text-muted-foreground">Huỷ</Text>
              </Button>
            </View>
          )}

          {/* Preview media đã chọn */}
          {drafts.length > 0 && (
            <View className="mb-2">
              <MediaDraftPicker
                drafts={drafts}
                onPick={pickAndAdd}
                onRemove={removeDraft}
                disabled={busy}
                variant="icon"
              />
            </View>
          )}

          <View className="flex-row items-center gap-2">
            <MediaDraftPicker
              drafts={[]}
              onPick={pickAndAdd}
              onRemove={removeDraft}
              disabled={busy}
              variant="icon"
            />
            <TextInput
              className="h-11 flex-1 rounded-full border border-input bg-muted px-4 text-foreground"
              placeholder="Viết bình luận..."
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              multiline
              editable={!busy}
            />
            <Button
              variant="ghost"
              className="h-auto p-2"
              disabled={!canSend}
              onPress={handleSend}>
              <Ionicons
                name="send"
                size={22}
                color={canSend ? colors.foreground : colors.mutedForeground}
              />
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
