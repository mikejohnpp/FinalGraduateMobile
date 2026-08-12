import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { StoriesBar } from '@/components/StoriesBar';
import { Text } from '@/components/ui/text';
import { useLikePost, useSuggestedFeed } from '@/hooks/usePost';
import { useUnreadCount } from '@/hooks/useNotification';
import { useThemeColors } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

export default function FeedScreen() {
  const { posts, loadMore, refresh, loading, refreshing } = useSuggestedFeed();
  const { like, unlike, loadingId } = useLikePost();
  const { unreadCount } = useUnreadCount();
  const userId = useAppSelector((r) => r.user.userId);
  const colors = useThemeColors();
  const router = useRouter();

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike]
  );

  const handleComment = useCallback(
    (post: IPost) => {
      router.push(`/post/${post.id}`);
    },
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <View className="flex-row items-center justify-between bg-card px-4 py-3">
        <Image
          source={require('@/assets/logo.svg')}
          style={{ width: 36, height: 36 }}
          contentFit="contain"
        />
        <View className="flex-row items-center gap-1">
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/search')}>
            <Ionicons name="search" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/reels')}>
            <Ionicons name="film-outline" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/(tabs)/create')}>
            <Ionicons name="add" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />

            {unreadCount > 0 && (
              <View className="absolute -right-0.5 -top-0.5 min-w-4 items-center justify-center rounded-full bg-destructive px-1">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70"
            onPress={() => router.push('/(tabs)/messages')}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.foreground} />
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
        ListHeaderComponent={
          <View className="mb-2">
            <StoriesBar />
          </View>
        }
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
