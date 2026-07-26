// Màn hình danh sách thông báo — port ý tưởng từ web
// (NotificationsInnerPopover + useNotification).
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useMarkAllAsRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/useNotification';
import { useNotificationClick } from '@/hooks/useNotificationClick';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import { resolveMediaUrl } from '@/lib/media';
import { timeAgo } from '@/lib/time';
import type { INotification, NotificationType } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

// Icon + màu theo loại thông báo.
// fallbackColor: màu mặc định theo theme (do component truyền vào, vì đây là
// hàm thuần nên không gọi được hook).
function iconFor(
  type: NotificationType,
  fallbackColor: string,
): { name: keyof typeof Ionicons.glyphMap; color: string } {

  switch (type) {
    case 'COMMENT':
    case 'REPLY':
      return { name: 'chatbubble', color: '#3b82f6' };
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPT':
      return { name: 'person-add', color: '#22c55e' };
    case 'GROUP_JOIN_REQUEST':
    case 'GROUP_JOIN_APPROVED':
      return { name: 'people', color: '#a855f7' };
    case 'GROUP_POST_PENDING':
    case 'GROUP_POST_APPROVED':
      return { name: 'document-text', color: '#f97316' };
    default:
      return { name: 'notifications', color: fallbackColor };

  }
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { notifications, loadMore, loading } = useNotifications(unreadOnly);
  const { unreadCount } = useUnreadCount();
  const { markAllAsRead } = useMarkAllAsRead();
  const handleClick = useNotificationClick();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-border px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large" className="flex-1">
          Thông báo
        </Text>
        {unreadCount > 0 && (
          <Button variant="ghost" className="h-auto p-1" onPress={markAllAsRead}>
            <Text className="text-sm text-primary">Đọc tất cả</Text>
          </Button>
        )}
      </View>

      {/* Tabs all / unread */}
      <View className="flex-row gap-2 px-4 py-2">
        <Pressable
          className={`rounded-full px-4 py-1.5 ${unreadOnly ? 'bg-muted' : 'bg-primary'}`}
          onPress={() => setUnreadOnly(false)}>
          <Text className={unreadOnly ? 'text-foreground' : 'text-primary-foreground'}>
            Tất cả
          </Text>
        </Pressable>
        <Pressable
          className={`rounded-full px-4 py-1.5 ${unreadOnly ? 'bg-primary' : 'bg-muted'}`}
          onPress={() => setUnreadOnly(true)}>
          <Text className={unreadOnly ? 'text-primary-foreground' : 'text-foreground'}>
            Chưa đọc{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => handleClick(item)} />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View className="mt-20 items-center px-6">
              <Text variant="muted" className="text-center">
                {unreadOnly ? 'Không có thông báo chưa đọc.' : 'Chưa có thông báo nào.'}
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

function NotificationRow({ item, onPress }: { item: INotification; onPress: () => void }) {
  const colors = useThemeColors();
  const openProfile = useOpenProfile();
  const avatarUri = resolveMediaUrl(item.actor?.avatar);
  const badge = iconFor(item.type, colors.mutedForeground);

  const actorName = item.actor?.nickName || item.actor?.name || 'Ai đó';
  const actorId = item.actor?.id;

  return (
    <Pressable
      className={`flex-row items-center gap-3 px-4 py-3 active:bg-muted ${item.isRead ? '' : 'bg-primary/5'}`}
      onPress={onPress}>
      {/* Avatar + badge loại — bấm avatar mở hồ sơ người gây ra thông báo,
          bấm phần còn lại của hàng vẫn đi tới nội dung liên quan. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem hồ sơ của ${actorName}`}
        disabled={!actorId}
        className="active:opacity-70"
        onPress={() => openProfile(actorId)}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
          />
        ) : (
          <View className="size-12 items-center justify-center rounded-full bg-muted">
            <Text className="text-lg font-bold uppercase text-muted-foreground">
              {actorName.charAt(0)}
            </Text>
          </View>
        )}
        <View
          className="absolute -bottom-0.5 -right-0.5 size-5 items-center justify-center rounded-full border-2 border-background"
          style={{ backgroundColor: badge.color }}>
          <Ionicons name={badge.name} size={10} color="white" />
        </View>
      </Pressable>

      <View className="flex-1">
        <Text numberOfLines={2} className={item.isRead ? 'text-muted-foreground' : 'text-foreground'}>
          <Text
            className="font-semibold"
            onPress={actorId ? () => openProfile(actorId) : undefined}>
            {actorName}
          </Text>{' '}
          {item.message}
        </Text>
        <Text variant="muted" className="mt-0.5 text-xs">
          {timeAgo(item.createdAt)}
        </Text>
      </View>

      {!item.isRead && <View className="size-2.5 rounded-full bg-primary" />}
    </Pressable>
  );
}
