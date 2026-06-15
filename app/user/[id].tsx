// Màn hình hồ sơ người dùng khác — dùng chung hook useProfile (tự tính isOwner).
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import { useProfile, useUserPosts } from '@/hooks/useProfile';
import { useLikePost } from '@/hooks/usePost';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileUserId = Number(id);
  const router = useRouter();

  const { profile, loading, refetch } = useProfile(profileUserId);
  const { posts } = useUserPosts(profileUserId);
  const { like, unlike, loadingId } = useLikePost();
  const currentUserId = useAppSelector((r) => r.user.userId);

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!currentUserId) return;
      post.hasLiked ? unlike(post.id, currentUserId) : like(post.id, currentUserId);
    },
    [currentUserId, like, unlike],
  );

  if (loading && !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <Text variant="muted">Không tải được hồ sơ.</Text>
        <Button variant="link" onPress={refetch}>
          <Text className="text-primary">Thử lại</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const avatarUri = resolveMediaUrl(profile.avatar);
  const coverUri = resolveMediaUrl(profile.coverPhoto);
  const displayName = profile.nickName || profile.userName;

  const header = (
    <View>
      {/* Cover */}
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
      ) : (
        <View className="h-40 w-full bg-muted" />
      )}

      {/* Avatar + name */}
      <View className="-mt-12 items-center px-4">
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'white' }}
            contentFit="cover"
          />
        ) : (
          <View className="size-24 items-center justify-center rounded-full border-4 border-background bg-muted">
            <Text className="text-3xl font-bold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Text variant="h3" className="mt-2">
          {displayName}
        </Text>
        {!!profile.bio && (
          <Text variant="muted" className="mt-1 text-center">
            {profile.bio}
          </Text>
        )}
        <Text variant="muted" className="mt-1 text-sm">
          {profile.friendCount} bạn bè
        </Text>
      </View>

      {/* Info rows */}
      <View className="mt-4 gap-2 px-4">
        {!!profile.location && <InfoRow icon="location-outline" text={profile.location} />}
        {!!profile.workplace && <InfoRow icon="briefcase-outline" text={profile.workplace} />}
        {!!profile.education && <InfoRow icon="school-outline" text={profile.education} />}
        {!!profile.hometown && <InfoRow icon="home-outline" text={profile.hometown} />}
      </View>

      <View className="mt-4 border-t border-border px-4 py-3">
        <Text variant="large">Bài viết</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back bar */}
      <View className="flex-row items-center gap-3 bg-card px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="hsl(240, 5.9%, 10%)" />
        </Button>
        <Text variant="large" numberOfLines={1}>
          {displayName}
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
        ListEmptyComponent={
          <View className="items-center bg-card py-8">
            <Text variant="muted">Chưa có bài viết nào.</Text>
          </View>
        }
        contentContainerClassName="bg-card pb-4"
      />
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={18} color="hsl(240, 3.8%, 46.1%)" />
      <Text className="text-muted-foreground">{text}</Text>
    </View>
  );
}
