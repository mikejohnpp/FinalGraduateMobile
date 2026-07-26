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


  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!currentUserId) return;
      post.hasLiked ? unlike(post.id, currentUserId) : like(post.id, currentUserId);
    },
    [currentUserId, like, unlike],
  );

  // Tạo (hoặc lấy) hội thoại 1-1 rồi điều hướng sang màn hình chat.
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
      {/* Cover */}
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
      ) : (
        <View className="h-40 w-full items-center justify-center bg-muted">
          <Text className="text-5xl font-bold uppercase text-muted-foreground">
            {displayName.charAt(0)}
          </Text>
        </View>
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

        {/* Nút hành động kết bạn/nhắn tin — ẩn khi xem hồ sơ của chính mình */}
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
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
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
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={18} color={colors.mutedForeground} />
      <Text className="text-muted-foreground">{text}</Text>
    </View>
  );
}

// FriendActionButtons — hiển thị nút theo trạng thái quan hệ bạn bè (đồng bộ web).
//   NOT_FRIENDS      → "Thêm bạn bè" + "Nhắn tin"
//   PENDING_SENT     → "Hủy lời mời" + "Nhắn tin"
//   PENDING_RECEIVED → "Chấp nhận" + "Nhắn tin"
//   FRIENDS          → "Bạn bè" (nhấn để hủy kết bạn) + "Nhắn tin"
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
          <Button
            className="flex-1 flex-row gap-1"
            disabled={actionLoading}
            onPress={onAccept}>
            <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
            <Text className="text-primary-foreground">Chấp nhận</Text>
          </Button>
        );
      default:
        return (
          <Button
            className="flex-1 flex-row gap-1"
            disabled={actionLoading}
            onPress={onSend}>
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

