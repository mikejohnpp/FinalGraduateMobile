import React from 'react';
import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupPendingPosts } from '@/hooks/useGroupAdmin';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import { timeAgo } from '@/lib/time';
import { useThemeColors } from '@/hooks/useTheme';
import { goBackOr } from '@/lib/navigation';

export default function GroupAdminPendingPostsScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openProfile = useOpenProfile();
  const { posts, loading, approvePost, rejectPost, loadMore, hasNext } = useGroupPendingPosts(id);

  const renderItem = ({ item }: { item: any }) => (
    <View className="mb-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem hồ sơ của ${item.authorName}`}
        className="mb-3 flex-row items-center gap-3 active:opacity-70"
        onPress={() => openProfile(item.authorId)}>
        {item.authorAvatarUrl ? (
          <Image
            source={{ uri: item.authorAvatarUrl }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
        ) : (
          <View className="size-10 items-center justify-center rounded-full bg-muted">
            <Text className="font-semibold text-muted-foreground">
              {item.authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-semibold">{item.authorName}</Text>
          <Text variant="small" className="text-muted-foreground">
            Đang chờ duyệt · {timeAgo(item.createdAt)}
          </Text>
        </View>
      </Pressable>

      <Text className="mb-4 text-foreground">{item.content}</Text>

      <View className="flex-row gap-2 border-t border-border pt-3">
        <Button className="flex-1" onPress={() => approvePost(item.id)}>
          <Text className="text-primary-foreground">Phê duyệt</Text>
        </Button>
        <Button variant="outline" className="flex-1" onPress={() => rejectPost(item.id)}>
          <Text className="text-destructive">Từ chối</Text>
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Button
          variant="ghost"
          className="h-auto p-1"
          accessibilityLabel="Quay lại"
          onPress={() => goBackOr(router, `/group/${id}/admin`)}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large">Bài viết chờ duyệt</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerClassName="p-4"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-10 opacity-70">
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.mutedForeground}
                className="mb-2"
              />
              <Text variant="large" className="text-muted-foreground">
                Không có bài viết chờ duyệt
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View className="items-center py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
