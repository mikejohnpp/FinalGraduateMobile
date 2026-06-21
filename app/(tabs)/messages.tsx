// Màn hình danh sách hội thoại — port ý tưởng từ web (Sidebar).
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useConversations, useSocketConnection } from '@/hooks/useChat';
import { resolveMediaUrl } from '@/lib/media';
import { useAppSelector } from '@/store/hooks';
import type { Conversation } from '@/types';

export default function MessagesScreen() {
  useSocketConnection();
  const { conversations, loading, refetch } = useConversations();
  const userId = useAppSelector((r) => r.user.userId);
  const router = useRouter();

  // Refetch mỗi khi quay lại tab.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Tên hiển thị: nhóm dùng name, 1-1 dùng tên thành viên còn lại.
  const getDisplayName = (conv: Conversation) => {
    if (conv.group) return conv.name;
    const other = conv.members.find((m) => m.id !== userId);
    return other?.username ?? conv.name;
  };

  const getAvatar = (conv: Conversation) => {
    if (conv.group) return null;
    const other = conv.members.find((m) => m.id !== userId);
    return resolveMediaUrl(other?.avatarUrl);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-card px-4 py-3">
        <Text variant="large">Đoạn chat</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const name = getDisplayName(item);
          const avatarUri = getAvatar(item);
          return (
            <Pressable
              className="flex-row items-center gap-3 px-4 py-3 active:bg-muted"
              onPress={() => router.push(`/chat/${item.id}`)}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 52, height: 52, borderRadius: 26 }}
                  contentFit="cover"
                />
              ) : (
                <View className="size-13 items-center justify-center rounded-full bg-muted" style={{ width: 52, height: 52 }}>
                  <Text className="text-xl font-bold uppercase text-muted-foreground">
                    {name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="font-semibold" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="muted" className="text-xs" numberOfLines={1}>
                  {item.group ? `${item.members.length} thành viên` : 'Nhấn để trò chuyện'}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        ListEmptyComponent={
          !loading ? (
            <View className="mt-20 items-center px-6">
              <Text variant="muted" className="text-center">
                Chưa có cuộc trò chuyện nào.
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
