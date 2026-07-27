// ProfileFriendsCard — khối "Bạn bè" trong hồ sơ, port từ web (ProfileFriends.tsx).
// Lấy bạn bè của CHỦ HỒ SƠ (không phải của người đang đăng nhập) qua
// GET users/friends?userId={profileId}&size={size}, hiển thị lưới 3 cột avatar + tên.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { API } from '@/lib/constants';
import { resolveMediaUrl } from '@/lib/media';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import friendService from '@/services/friendService';
import type { CursorPageResponse, IAuthor, IFriendship } from '@/types';

interface ProfileFriendsCardProps {
  profileUserId: number;
  friendCount: number;
  /** Số bạn bè tải về. Web dùng 6 cho khối xem trước; tab "Bạn bè" hiển thị nhiều hơn. */
  size?: number;
  /** Bấm "Xem tất cả bạn bè" — thường là chuyển sang tab "Bạn bè". */
  onViewAll?: () => void;
}

export function ProfileFriendsCard({
  profileUserId,
  friendCount,
  size = 6,
  onViewAll,
}: ProfileFriendsCardProps) {
  const openProfile = useOpenProfile();
  const [friends, setFriends] = useState<IAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileUserId) return;
    let cancelled = false;

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const result = await friendService.getSingle<CursorPageResponse<IFriendship>>(
          API.FRIEND.BASE,
          undefined,
          { userId: profileUserId, size },
        );
        if (!cancelled) setFriends(result?.data?.map((f) => f.user) ?? []);
      } catch (e) {
        console.error('Lỗi khi tải bạn bè của hồ sơ:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFriends();
    return () => {
      cancelled = true;
    };
  }, [profileUserId, size]);

  return (
    <View className="bg-card px-4 py-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text variant="large">Bạn bè</Text>
          <Text variant="muted" className="text-sm">
            {friendCount} người bạn
          </Text>
        </View>
        {onViewAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả bạn bè"
            className="active:opacity-70"
            onPress={onViewAll}>
            <Text className="text-primary">Xem tất cả bạn bè</Text>
          </Pressable>
        )}
      </View>

      {loading && friends.length === 0 ? (
        <View className="items-center py-6">
          <ActivityIndicator />
        </View>
      ) : friends.length === 0 ? (
        <View className="items-center py-6">
          <Text variant="muted">Chưa có bạn bè nào</Text>
        </View>
      ) : (
        <View className="-mx-1 mt-3 flex-row flex-wrap">
          {friends.map((friend) => (
            <FriendMiniCard key={friend.id} friend={friend} onPress={() => openProfile(friend.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

// Ô bạn bè: ảnh vuông + tên, bấm để mở hồ sơ — giống FriendMiniCard của web.
function FriendMiniCard({ friend, onPress }: { friend: IAuthor; onPress: () => void }) {
  const avatarUri = resolveMediaUrl(friend.avatar);
  const displayName = friend.nickName || friend.name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem hồ sơ của ${displayName}`}
      className="w-1/3 p-1 active:opacity-80"
      onPress={onPress}>
      <View className="aspect-square w-full overflow-hidden rounded-md bg-muted">
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-bold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text className="mt-1 text-sm font-semibold" numberOfLines={1}>
        {displayName}
      </Text>
    </Pressable>
  );
}
