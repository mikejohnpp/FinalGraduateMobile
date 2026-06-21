// Màn hình chi tiết nhóm — port ý tưởng từ web (GroupDetail).
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupActions, useGroupDetail, useSingleGroupPosts } from '@/hooks/useGroup';
import { useLikePost } from '@/hooks/usePost';
import { resolveMediaUrl } from '@/lib/media';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);
  const router = useRouter();

  const { group, loading } = useGroupDetail(groupId);
  const { posts, loadMore, loading: postsLoading } = useSingleGroupPosts(groupId);
  const { joinGroup, leaveGroup, loading: actionLoading } = useGroupActions();
  const { like, unlike, loadingId } = useLikePost();
  const userId = useAppSelector((r) => r.user.userId);

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike],
  );

  if (loading && !group) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const coverUri = resolveMediaUrl(group?.coverPhoto || group?.avatar);

  const header = (
    <View className="bg-card">
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
      ) : (
        <View className="h-40 w-full items-center justify-center bg-muted">
          <Text className="text-5xl font-bold uppercase text-muted-foreground">
            {group?.name?.charAt(0) || '?'}
          </Text>
        </View>
      )}
      <View className="gap-2 p-4">
        <Text variant="h3">{group?.name}</Text>
        <Text variant="muted" className="text-sm">
          {group?.privacy === 'public' ? 'Công khai' : 'Riêng tư'} · {group?.memberCount} thành viên
        </Text>

        {group?.isJoined ? (
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary" disabled={actionLoading} onPress={() => leaveGroup(groupId)}>
              <Text>Rời nhóm</Text>
            </Button>
            {group?.role === 'ADMIN' && (
              <Button className="flex-1" variant="default" onPress={() => router.push(`/group/${groupId}/admin`)}>
                <Ionicons name="settings-outline" size={16} color="white" />
                <Text className="text-primary-foreground">Quản trị</Text>
              </Button>
            )}
          </View>
        ) : group?.isPending ? (
          <Button variant="outline" disabled>
            <Text className="text-muted-foreground">Đang chờ duyệt</Text>
          </Button>
        ) : (
          <Button disabled={actionLoading} onPress={() => group && joinGroup(group)}>
            <Text className="text-primary-foreground">Tham gia nhóm</Text>
          </Button>
        )}
      </View>
      <View className="border-t border-border px-4 py-3">
        <Text variant="large">Bài viết</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button overlay */}
      <View className="flex-row items-center gap-3 bg-card px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="hsl(240, 5.9%, 10%)" />
        </Button>
        <Text variant="large" numberOfLines={1}>
          {group?.name ?? 'Nhóm'}
        </Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={handleToggleLike}
            onComment={(p) => router.push(`/post/${p.id}`)}
            likeDisabled={loadingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !postsLoading ? (
            <View className="items-center bg-card py-8">
              <Text variant="muted">
                {group?.privacy === 'private' && !group?.isJoined
                  ? 'Đây là nhóm kín. Bạn cần tham gia để xem bài viết.'
                  : 'Chưa có bài viết nào trong nhóm.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          postsLoading ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
