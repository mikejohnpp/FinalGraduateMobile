// Tab "Khám phá" — nhóm gợi ý, có tìm theo tên (lọc client trên danh sách gợi ý).
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GroupCard } from '@/components/GroupCard';
import { Text } from '@/components/ui/text';
import { useGroupActions, useGroupsData } from '@/hooks/useGroup';
import { useThemeColors } from '@/hooks/useTheme';
import type { IGroup } from '@/types';

export function DiscoverTab() {
  const colors = useThemeColors();
  const router = useRouter();
  const { suggestedGroups, loading, refetch } = useGroupsData();
  const { joinGroup, leaveGroup, loading: actionLoading } = useGroupActions();
  const [query, setQuery] = useState('');

  const goDetail = useCallback((group: IGroup) => router.push(`/group/${group.id}`), [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestedGroups;
    return suggestedGroups.filter((g) => g.name?.toLowerCase().includes(q));
  }, [suggestedGroups, query]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => String(item.id)}
      contentContainerClassName="gap-3 p-4"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      ListHeaderComponent={
        <View className="flex-row items-center gap-2 rounded-full border border-border bg-card px-3">
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            className="flex-1 py-2.5 text-base text-foreground"
            placeholder="Tìm nhóm theo tên..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Tìm nhóm theo tên"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá tìm kiếm"
              hitSlop={8}
              onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <GroupCard
          group={item}
          onPress={() => goDetail(item)}
          onJoin={() => joinGroup(item)}
          onLeave={() => leaveGroup(item.id)}
          onManage={() => router.push(`/group/${item.id}/admin`)}
          actionLoading={actionLoading}
        />
      )}
      ListEmptyComponent={
        !loading ? (
          <View className="mt-12 items-center gap-2 px-8">
            <Ionicons name="people-outline" size={44} color={colors.mutedForeground} />
            <Text variant="muted" className="text-center">
              {query ? 'Không tìm thấy nhóm phù hợp.' : 'Chưa có nhóm gợi ý.'}
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
  );
}
