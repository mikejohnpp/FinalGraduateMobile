import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { ProfileAboutCard } from '@/components/profile/ProfileAboutCard';
import { ProfileFriendsCard } from '@/components/profile/ProfileFriendsCard';
import { ProfileReels } from '@/components/profile/ProfileReels';
import { ProfileTabsBar, type ProfileTab } from '@/components/profile/ProfileTabsBar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { pickImageWithMeta } from '@/lib/imagePicker';
import { resolveMediaUrl } from '@/lib/media';
import { useThemeColors } from '@/hooks/useTheme';
import { useProfile, useUploadAvatar, useUploadCover, useUserPosts } from '@/hooks/useProfile';
import { useLikePost } from '@/hooks/usePost';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const userId = useAppSelector((r) => r.user.userId);
  const { profile, isOwner, loading, refetch } = useProfile(userId);
  const { posts } = useUserPosts(userId);
  const { upload: uploadAvatar, loading: avatarLoading } = useUploadAvatar();
  const { upload: uploadCover, loading: coverLoading } = useUploadCover();
  const { like, unlike, loadingId } = useLikePost();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike]
  );

  const handlePickAvatar = useCallback(async () => {
    const picked = await pickImageWithMeta([1, 1]);
    if (picked) await uploadAvatar(picked.uri, picked.mimeType);
  }, [uploadAvatar]);

  const handlePickCover = useCallback(async () => {
    const picked = await pickImageWithMeta([16, 9]);
    if (picked) await uploadCover(picked.uri, picked.mimeType);
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
      <Pressable onPress={isOwner ? handlePickCover : undefined}>
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{ width: '100%', height: 160 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-40 w-full items-center justify-center bg-muted">
            <Text className="text-5xl font-bold uppercase text-muted-foreground">
              {displayName.charAt(0)}
            </Text>
          </View>
        )}
        {isOwner && (
          <View className="absolute bottom-2 right-2 rounded-full bg-background/80 p-2">
            {coverLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Ionicons name="camera" size={18} color={colors.foreground} />
            )}
          </View>
        )}
      </Pressable>

      <View className="-mt-12 items-center px-4">
        <Pressable onPress={isOwner ? handlePickAvatar : undefined}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 3,
                borderColor: 'white',
              }}
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
                <Ionicons name="camera" size={16} color={colors.foreground} />
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem danh sách bạn bè"
          className="mt-1 active:opacity-70"
          onPress={() => setActiveTab('friends')}>
          <Text variant="muted" className="text-sm">
            {profile.friendCount} bạn bè
          </Text>
        </Pressable>

        {isOwner && (
          <Button
            variant="outline"
            className="mt-3 w-full rounded-full"
            onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color={colors.foreground} />
            <Text>Chỉnh sửa trang cá nhân</Text>
          </Button>
        )}
      </View>

      <View className="mt-4">
        <ProfileTabsBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {activeTab === 'posts' && (
        <>
          <ProfileAboutCard profile={profile} />
          <View className="h-2" />
          <ProfileFriendsCard
            profileUserId={profile.id}
            friendCount={profile.friendCount}
            onViewAll={() => setActiveTab('friends')}
          />
          <View className="h-2" />
        </>
      )}

      {activeTab === 'about' && <ProfileAboutCard profile={profile} />}

      {activeTab === 'friends' && (
        <ProfileFriendsCard
          profileUserId={profile.id}
          friendCount={profile.friendCount}
          size={30}
        />
      )}

      {activeTab === 'reels' && <ProfileReels userId={profile.id} isOwner={isOwner} />}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <FlatList
        data={activeTab === 'posts' ? posts : []}
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
          activeTab === 'posts' ? (
            <View className="items-center bg-card py-8">
              <Text variant="muted">Chưa có bài viết nào.</Text>
            </View>
          ) : null
        }
        contentContainerClassName="bg-card pb-4"
      />
    </SafeAreaView>
  );
}
