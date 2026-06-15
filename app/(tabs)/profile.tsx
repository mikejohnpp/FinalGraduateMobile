// Màn hình hồ sơ cá nhân — port ý tưởng từ web (Profile + ProfileCover/About).
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { pickImage } from '@/lib/imagePicker';
import { resolveMediaUrl } from '@/lib/media';
import { useProfile, useUploadAvatar, useUploadCover, useUserPosts } from '@/hooks/useProfile';
import { useLikePost } from '@/hooks/usePost';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

export default function ProfileScreen() {
  const userId = useAppSelector((r) => r.user.userId);
  const { profile, isOwner, loading, refetch } = useProfile(userId);
  const { posts } = useUserPosts(userId);
  const { upload: uploadAvatar, loading: avatarLoading } = useUploadAvatar();
  const { upload: uploadCover, loading: coverLoading } = useUploadCover();
  const { like, unlike, loadingId } = useLikePost();
  const router = useRouter();

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike],
  );

  const handlePickAvatar = useCallback(async () => {
    const uri = await pickImage([1, 1]);
    if (uri) await uploadAvatar(uri);
  }, [uploadAvatar]);

  const handlePickCover = useCallback(async () => {
    const uri = await pickImage([16, 9]);
    if (uri) await uploadCover(uri);
  }, [uploadCover]);

  if (loading && !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
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
      <Pressable onPress={isOwner ? handlePickCover : undefined}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
        ) : (
          <View className="h-40 w-full bg-muted" />
        )}
        {isOwner && (
          <View className="absolute bottom-2 right-2 rounded-full bg-background/80 p-2">
            {coverLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Ionicons name="camera" size={18} color="hsl(240, 5.9%, 10%)" />
            )}
          </View>
        )}
      </Pressable>

      {/* Avatar + name */}
      <View className="-mt-12 items-center px-4">
        <Pressable onPress={isOwner ? handlePickAvatar : undefined}>
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
          {isOwner && (
            <View className="absolute bottom-0 right-0 rounded-full bg-background/90 p-1.5">
              {avatarLoading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="camera" size={16} color="hsl(240, 5.9%, 10%)" />
              )}
            </View>
          )}
        </Pressable>

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

        {isOwner && (
          <Button
            variant="outline"
            className="mt-3 w-full rounded-full"
            onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color="hsl(240, 5.9%, 10%)" />
            <Text>Chỉnh sửa trang cá nhân</Text>
          </Button>
        )}
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
