// Màn hình danh sách hội thoại — port ý tưởng từ web (Sidebar).
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useConversations, useSocketConnection } from '@/hooks/useChat';
import { resolveMediaUrl } from '@/lib/media';
import { useAppSelector } from '@/store/hooks';
import type { Conversation } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

export default function MessagesScreen() {
  const colors = useThemeColors();
  useSocketConnection();
  const { conversations, loading, refetch } = useConversations();
  const userId = useAppSelector((r) => r.user.userId);
  const onlineUsers = useAppSelector((r) => r.userOnline.onlineUsers);
  const router = useRouter();
  const [query, setQuery] = useState('');

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

  // Online = có thành viên khác mình đang online (khớp cách web tính trong
  // ConversationItem, nhưng bỏ chính mình để dot không luôn xanh).
  const isConversationOnline = (conv: Conversation) =>
    conv.members.some((m) => m.id !== userId && onlineUsers.includes(m.id));

  // Lọc hội thoại theo tên hiển thị (khớp web: tìm theo tiêu đề).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => getDisplayName(c).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, query, userId]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-card px-4 py-3">
        <Text variant="large">Đoạn chat</Text>
      </View>

      {/* Ô tìm kiếm hội thoại */}
      <View className="flex-row items-center gap-2 bg-card px-4 pb-3">
        <View className="flex-1 flex-row items-center gap-2 rounded-full bg-muted px-3">
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            className="h-10 flex-1 text-foreground"
            placeholder="Tìm kiếm đoạn chat"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const name = getDisplayName(item);
          const avatarUri = getAvatar(item);
          const online = isConversationOnline(item);
          return (
            <Pressable
              className="flex-row items-center gap-3 px-4 py-3 active:bg-muted"
              onPress={() => router.push(`/chat/${item.id}`)}>
              <View className="relative">
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
                {/* Dấu trạng thái: xanh = online, hổ phách = offline (giống web) */}
                <View
                  className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-background ${online ? 'bg-green-500' : 'bg-amber-400'}`}
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="muted" className="text-xs" numberOfLines={1}>
                  {item.group
                    ? `${item.members.length} thành viên`
                    : online
                      ? 'Đang hoạt động'
                      : 'Nhấn để trò chuyện'}
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
