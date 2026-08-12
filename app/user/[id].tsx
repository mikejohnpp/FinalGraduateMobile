import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostCard } from '@/components/PostCard';
import { ProfileAboutCard } from '@/components/profile/ProfileAboutCard';
import { ProfileFriendsCard } from '@/components/profile/ProfileFriendsCard';
import { ProfileReels } from '@/components/profile/ProfileReels';
import { ProfileTabsBar, type ProfileTab } from '@/components/profile/ProfileTabsBar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import { useThemeColors } from '@/hooks/useTheme';
import { useProfile, useUserPosts } from '@/hooks/useProfile';
import { useProfileFriendStatus } from '@/hooks/useFriend';
import { useLikePost } from '@/hooks/usePost';
import chatService from '@/services/chatService';
import { useAppSelector } from '@/store/hooks';
import type { FriendStatus, IPost } from '@/types';

export default function UserProfileScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileUserId = Number(id);
  const router = useRouter();

  const { profile, loading, refetch } = useProfile(profileUserId);
  const { posts } = useUserPosts(profileUserId);
  const { like, unlike, loadingId } = useLikePost();
  const currentUserId = useAppSelector((r) => r.user.userId);
  const friendStatus = useProfileFriendStatus(profileUserId);
  const isOwner = currentUserId === profileUserId;

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!currentUserId) return;
      post.hasLiked ? unlike(post.id, currentUserId) : like(post.id, currentUserId);
    },
    [currentUserId, like, unlike]
  );

  const handleMessage = useCallback(async () => {
    if (!currentUserId) return;
    const conversation = await chatService.createDirectConversation(profileUserId, currentUserId);
    if (conversation) router.push(`/chat/${conversation.id}`);
  }, [currentUserId, profileUserId, router]);

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

      <View className="-mt-12 items-center px-4">
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

        {!isOwner && (
          <FriendActionButtons
            status={friendStatus.status}
            loading={friendStatus.loading}
            actionLoading={friendStatus.actionLoading}
            onSend={friendStatus.sendRequest}
            onCancel={friendStatus.cancelRequest}
            onAccept={friendStatus.acceptRequest}
            onUnfriend={friendStatus.unfriend}
            onMessage={handleMessage}
          />
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
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 bg-card px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large" numberOfLines={1}>
          {displayName}
        </Text>
      </View>

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

function FriendActionButtons({
  status,
  loading,
  actionLoading,
  onSend,
  onCancel,
  onAccept,
  onUnfriend,
  onMessage,
}: {
  status: FriendStatus | null;
  loading: boolean;
  actionLoading: boolean;
  onSend: () => void;
  onCancel: () => void;
  onAccept: () => void;
  onUnfriend: () => void;
  onMessage: () => void;
}) {
  const colors = useThemeColors();
  if (loading) {
    return (
      <View className="mt-3 h-9 w-full items-center justify-center">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const renderPrimary = () => {
    switch (status) {
      case 'FRIENDS':
        return (
          <Button
            variant="secondary"
            className="flex-1 flex-row gap-1"
            disabled={actionLoading}
            onPress={onUnfriend}>
            <Ionicons name="people" size={16} color={colors.foreground} />
            <Text>Bạn bè</Text>
          </Button>
        );
      case 'PENDING_SENT':
        return (
          <Button
            variant="secondary"
            className="flex-1 flex-row gap-1"
            disabled={actionLoading}
            onPress={onCancel}>
            <Ionicons name="close" size={16} color={colors.foreground} />
            <Text>Hủy lời mời</Text>
          </Button>
        );
      case 'PENDING_RECEIVED':
        return (
          <Button className="flex-1 flex-row gap-1" disabled={actionLoading} onPress={onAccept}>
            <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
            <Text className="text-primary-foreground">Chấp nhận</Text>
          </Button>
        );
      default:
        return (
          <Button className="flex-1 flex-row gap-1" disabled={actionLoading} onPress={onSend}>
            <Ionicons name="person-add" size={16} color={colors.primaryForeground} />
            <Text className="text-primary-foreground">Thêm bạn bè</Text>
          </Button>
        );
    }
  };

  return (
    <View className="mt-3 w-full flex-row gap-2 px-4">
      {renderPrimary()}
      <Button variant="outline" className="flex-1 flex-row gap-1" onPress={onMessage}>
        <Ionicons name="chatbubble-outline" size={16} color={colors.foreground} />
        <Text>Nhắn tin</Text>
      </Button>
    </View>
  );
}
