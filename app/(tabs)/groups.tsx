// Màn hình Nhóm — port ý tưởng từ web (GroupsMine + GroupsDiscover).
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GroupCard } from '@/components/GroupCard';
import { Text } from '@/components/ui/text';
import { useGroupActions, useGroupsData } from '@/hooks/useGroup';
import type { IGroup } from '@/types';

export default function GroupsScreen() {
  const { joinedGroups, suggestedGroups, loading, refetch } = useGroupsData();
  const { joinGroup, leaveGroup, loading: actionLoading } = useGroupActions();
  const router = useRouter();

  const goDetail = useCallback(
    (group: IGroup) => router.push(`/group/${group.id}`),
    [router],
  );

  // Gộp 2 nhóm thành 1 danh sách có section header thông qua data đặc biệt.
  const sections = [
    { title: 'Nhóm của bạn', data: joinedGroups, empty: 'Bạn chưa tham gia nhóm nào.' },
    { title: 'Khám phá', data: suggestedGroups, empty: 'Chưa có nhóm gợi ý.' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <View className="bg-card px-4 py-3">
        <Text variant="large">Nhóm</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        contentContainerClassName="gap-4 p-4"
        renderItem={({ item }) => (
          <View className="gap-3">
            <Text variant="large">{item.title}</Text>
            {item.data.length === 0 ? (
              <Text variant="muted" className="text-sm">
                {item.empty}
              </Text>
            ) : (
              item.data.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onPress={() => goDetail(group)}
                  onJoin={() => joinGroup(group)}
                  onLeave={() => leaveGroup(group.id)}
                  actionLoading={actionLoading}
                />
              ))
            )}
          </View>
        )}
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
