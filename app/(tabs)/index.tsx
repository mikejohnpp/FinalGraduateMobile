// Màn hình Feed (bảng tin) — port từ web (src/views/home/Home.tsx + NewsFeed).
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { Text } from '@/components/ui/text';
import { useLikePost, useSuggestedFeed } from '@/hooks/usePost';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

export default function FeedScreen() {
  const { posts, loadMore, refresh, loading, refreshing } = useSuggestedFeed();
  const { like, unlike, loadingId } = useLikePost();
  const userId = useAppSelector((r) => r.user.userId);
  const router = useRouter();

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike],
  );

  const handleComment = useCallback(
    (post: IPost) => {
      router.push(`/post/${post.id}`);
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      {/* Header — logo + lối tắt tìm kiếm, tạo bài, tin nhắn */}
      <View className="flex-row items-center justify-between bg-card px-4 py-3">
        <Text className="text-2xl font-extrabold text-primary">f</Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/search')}>
            <Ionicons name="search" size={20} color="hsl(240, 5.9%, 10%)" />
          </Pressable>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/(tabs)/create')}>
            <Ionicons name="add" size={22} color="hsl(240, 5.9%, 10%)" />
          </Pressable>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/(tabs)/messages')}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="hsl(240, 5.9%, 10%)" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={handleToggleLike}
            onComment={handleComment}
            likeDisabled={loadingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerClassName="pb-4"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !refreshing ? (
            <View className="mt-20 items-center px-6">
              <Text variant="muted" className="text-center">
                Chưa có bài viết nào. Hãy kéo xuống để làm mới.
              </Text>
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
    </SafeAreaView>
  );
}
