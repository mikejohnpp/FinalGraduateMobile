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
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useComments, useCreateComment } from '@/hooks/useComment';
import type { IComment } from '@/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const router = useRouter();

  const { comments, loading, loadMore } = useComments(postId);
  const { create, loading: sending } = useCreateComment(postId);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<IComment | null>(null);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    const result = await create(text, replyTo?.id ?? null);
    if (result) {
      setText('');
      setReplyTo(null);
    }
  }, [text, replyTo, create]);

  const handleReply = useCallback((comment: IComment) => {
    setReplyTo(comment);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="hsl(240, 5.9%, 10%)" />
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
          <View className="flex-row items-center gap-2">
            <TextInput
              className="h-11 flex-1 rounded-full border border-input bg-muted px-4 text-foreground"
              placeholder="Viết bình luận..."
              placeholderTextColor="hsl(240, 3.8%, 46.1%)"
              value={text}
              onChangeText={setText}
              multiline
            />
            <Button
              variant="ghost"
              className="h-auto p-2"
              disabled={sending || !text.trim()}
              onPress={handleSend}>
              <Ionicons
                name="send"
                size={22}
                color={text.trim() ? 'hsl(240, 5.9%, 10%)' : 'hsl(240, 3.8%, 46.1%)'}
              />
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
