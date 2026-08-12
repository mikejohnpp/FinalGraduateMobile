import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupFeed, useGroupsData } from '@/hooks/useGroup';
import { useLikePost } from '@/hooks/usePost';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';
import { useAppSelector } from '@/store/hooks';
import type { IGroup, IPost } from '@/types';

interface ForYouTabProps {
  onGoToMine: () => void;
  onGoToDiscover: () => void;
}

export function ForYouTab({ onGoToMine, onGoToDiscover }: ForYouTabProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { joinedGroups, loading: groupsLoading, refetch: refetchGroups } = useGroupsData();
  const { feed, loading: feedLoading, error, loadMore, refetch: refetchFeed } = useGroupFeed();
  const { like, unlike, loadingId } = useLikePost();
  const userId = useAppSelector((r) => r.user.userId);

  const goDetail = useCallback((groupId: number) => router.push(`/group/${groupId}`), [router]);

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      return post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike]
  );

  const handleRefresh = useCallback(() => {
    refetchGroups();
    refetchFeed();
  }, [refetchGroups, refetchFeed]);

  const joinedStrip = joinedGroups.length > 0 && (
    <View className="mb-2 bg-card pb-3">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="font-semibold">Nhóm của bạn</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem tất cả nhóm của bạn"
          onPress={onGoToMine}>
          <Text className="text-sm text-primary">Xem tất cả</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-4">
        {joinedGroups.map((group: IGroup) => {
          const uri = resolveMediaUrl(group.avatar || group.coverPhoto);
          return (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              accessibilityLabel={`Mở nhóm ${group.name}`}
              className="w-20 items-center gap-1 active:opacity-70"
              onPress={() => goDetail(group.id)}>
              <View className="size-16 overflow-hidden rounded-2xl bg-muted">
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-primary/10">
                    <Text className="text-xl font-bold uppercase text-primary">
                      {group.name?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-center text-[11px]" numberOfLines={2}>
                {group.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      data={feed.items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View>
          {joinedStrip}
          {feed.items.length > 0 && (
            <View className="bg-card px-4 py-2">
              <Text className="font-semibold">Hoạt động mới đây</Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onToggleLike={handleToggleLike}
          onComment={(p) => router.push(`/post/${p.id}`)}
          onPressGroup={(groupId) => goDetail(groupId)}
          likeDisabled={loadingId === item.id}
        />
      )}
      ItemSeparatorComponent={() => <View className="h-2" />}
      contentContainerClassName="pb-4"
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={(feedLoading || groupsLoading) && feed.items.length === 0}
          onRefresh={handleRefresh}
        />
      }
      ListEmptyComponent={
        !feedLoading ? (
          <View className="mt-16 items-center gap-3 px-8">
            <Ionicons name="newspaper-outline" size={44} color={colors.mutedForeground} />
            <Text variant="muted" className="text-center">
              {error ?? 'Chưa có bài viết nào từ các nhóm của bạn.'}
            </Text>
            <Button variant="secondary" onPress={onGoToDiscover}>
              <Text>Khám phá nhóm</Text>
            </Button>
          </View>
        ) : null
      }
      ListFooterComponent={
        feedLoading && feed.items.length > 0 ? (
          <View className="py-4">
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
}
