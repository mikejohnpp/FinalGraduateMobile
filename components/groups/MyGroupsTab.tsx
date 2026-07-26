// Tab "Nhóm của bạn" — nhóm mình quản lý và nhóm đã tham gia.
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GroupRow } from '@/components/GroupRow';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupsData } from '@/hooks/useGroup';
import type { IGroup } from '@/types';

// Mỗi phần tử của danh sách: header phần, một nhóm, hoặc dòng trống.
type Row =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'group'; key: string; group: IGroup; managed: boolean }
  | { kind: 'empty'; key: string; text: string };

export function MyGroupsTab() {
  const router = useRouter();
  const { joinedGroups, loading, refetch } = useGroupsData();

  const goDetail = useCallback((groupId: number) => router.push(`/group/${groupId}`), [router]);

  const rows = useMemo<Row[]>(() => {
    const managed = joinedGroups.filter((g) => g.role === 'ADMIN');
    const member = joinedGroups.filter((g) => g.role !== 'ADMIN');
    const out: Row[] = [];

    if (managed.length > 0) {
      out.push({ kind: 'header', key: 'h-managed', title: 'Nhóm bạn quản lý' });
      managed.forEach((g) =>
        out.push({ kind: 'group', key: `m-${g.id}`, group: g, managed: true }),
      );
    }

    out.push({ kind: 'header', key: 'h-joined', title: 'Nhóm đã tham gia' });
    if (member.length === 0) {
      out.push({ kind: 'empty', key: 'e-joined', text: 'Bạn chưa tham gia nhóm nào.' });
    } else {
      member.forEach((g) =>
        out.push({ kind: 'group', key: `j-${g.id}`, group: g, managed: false }),
      );
    }

    return out;
  }, [joinedGroups]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.key}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      renderItem={({ item }) => {
        if (item.kind === 'header') {
          // Cùng nền với dòng nhóm bên dưới để không tạo vệt phân cách.
          return (
            <View className="bg-card px-4 pb-1 pt-4">
              <Text className="font-semibold">{item.title}</Text>
            </View>
          );
        }
        if (item.kind === 'empty') {
          return (
            <View className="bg-card px-4 py-4">
              <Text variant="muted" className="text-sm">
                {item.text}
              </Text>
            </View>
          );
        }
        return (
          <GroupRow
            group={item.group}
            onPress={() => goDetail(item.group.id)}
            right={
              item.managed ? (
                <Button
                  variant="secondary"
                  size="sm"
                  accessibilityLabel={`Quản lý nhóm ${item.group.name}`}
                  onPress={() => router.push(`/group/${item.group.id}/admin`)}>
                  <Text className="text-xs">Quản lý</Text>
                </Button>
              ) : null
            }
          />
        );
      }}
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
