import React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupStats } from '@/hooks/useGroupAdmin';
import { useThemeColors } from '@/hooks/useTheme';
import { goBackOr } from '@/lib/navigation';

const CHART_HEIGHT = 140;

export default function GroupAdminOverviewScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { stats, loading } = useGroupStats(id);

  if (loading || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-2">
          <Button
            variant="ghost"
            className="h-auto p-1"
            accessibilityLabel="Quay lại"
            onPress={() => goBackOr(router, `/group/${id}`)}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Button>
          <Text variant="large">Tổng quan</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const reviewItems = [
    {
      label: 'Bài viết đang chờ',
      icon: 'document-text-outline' as const,
      value: stats.pendingPosts,
      path: `/group/${id}/admin/pending-posts`,
      isStatus: false,
    },
    {
      label: 'Yêu cầu làm thành viên',
      icon: 'people-outline' as const,
      value: stats.memberRequests,
      path: `/group/${id}/admin/member-requests`,
      isStatus: false,
    },
  ];

  const totalReviews = reviewItems.reduce(
    (acc, item) => (item.isStatus ? acc : acc + item.value),
    0
  );

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return 'trending-up';
    if (change < 0) return 'trending-down';
    return 'remove';
  };

  const maxActivity = Math.max(0, ...(stats.weeklyActivity ?? []).map((d) => d.value));

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Button
          variant="ghost"
          className="h-auto p-1"
          accessibilityLabel="Quay lại"
          onPress={() => goBackOr(router, `/group/${id}`)}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large">Tổng quan quản trị</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
        <View className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <View className="mb-4">
            <Text variant="large" className="font-semibold">
              Cần xem xét
            </Text>
            <Text variant="small" className="mt-1 text-muted-foreground">
              {totalReviews === 0
                ? '0 thông tin mới cần xem xét'
                : `${totalReviews} thông tin cần xem xét`}
            </Text>
          </View>

          <View className="gap-3">
            {reviewItems.map((item, idx) => (
              <Pressable
                key={idx}
                className="flex-row items-center justify-between rounded-lg border border-border p-3 active:bg-muted"
                onPress={() => router.push(item.path as any)}>
                <View className="flex-row items-center gap-3">
                  <View className="rounded-full bg-muted p-2">
                    <Ionicons name={item.icon} size={20} color={colors.mutedForeground} />
                  </View>
                  <View>
                    <Text className="font-semibold">{item.label}</Text>
                    <Text variant="small" className="text-muted-foreground">
                      {item.isStatus ? `${item.value} trường hợp vi phạm` : `${item.value} mục mới`}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="mr-1 font-semibold">{item.value}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <View className="mb-4">
            <Text variant="large" className="font-semibold">
              Tóm tắt hoạt động
            </Text>
            <Text variant="small" className="mt-1 text-muted-foreground">
              Trong 7 ngày qua
            </Text>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between rounded-lg border border-border p-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="document-text-outline" size={20} color={colors.mutedForeground} />
                <Text className="font-medium">Bài viết</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold">{stats.weeklyPosts}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={getChangeIcon(stats.weeklyPostsChange) as any}
                    size={14}
                    color={
                      stats.weeklyPostsChange > 0
                        ? 'green'
                        : stats.weeklyPostsChange < 0
                          ? 'red'
                          : 'gray'
                    }
                  />
                  <Text
                    className={`text-xs font-medium ${getChangeColor(stats.weeklyPostsChange)}`}>
                    {Math.abs(stats.weeklyPostsChange)}%
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between rounded-lg border border-border p-3">
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={colors.mutedForeground}
                />
                <Text className="font-medium">Bình luận</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold">{stats.weeklyComments}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={getChangeIcon(stats.weeklyCommentsChange) as any}
                    size={14}
                    color={
                      stats.weeklyCommentsChange > 0
                        ? 'green'
                        : stats.weeklyCommentsChange < 0
                          ? 'red'
                          : 'gray'
                    }
                  />
                  <Text
                    className={`text-xs font-medium ${getChangeColor(stats.weeklyCommentsChange)}`}>
                    {Math.abs(stats.weeklyCommentsChange)}%
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between rounded-lg border border-border p-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="thumbs-up-outline" size={20} color={colors.mutedForeground} />
                <Text className="font-medium">Cảm xúc</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold">{stats.weeklyReactions}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={getChangeIcon(stats.weeklyReactionsChange) as any}
                    size={14}
                    color={
                      stats.weeklyReactionsChange > 0
                        ? 'green'
                        : stats.weeklyReactionsChange < 0
                          ? 'red'
                          : 'gray'
                    }
                  />
                  <Text
                    className={`text-xs font-medium ${getChangeColor(stats.weeklyReactionsChange)}`}>
                    {Math.abs(stats.weeklyReactionsChange)}%
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between rounded-lg border border-border p-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="people-outline" size={20} color={colors.mutedForeground} />
                <Text className="font-medium">Thành viên hoạt động</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold">{stats.activeMembers}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={getChangeIcon(stats.activeMembersChange) as any}
                    size={14}
                    color={
                      stats.activeMembersChange > 0
                        ? 'green'
                        : stats.activeMembersChange < 0
                          ? 'red'
                          : 'gray'
                    }
                  />
                  <Text
                    className={`text-xs font-medium ${getChangeColor(stats.activeMembersChange)}`}>
                    {Math.abs(stats.activeMembersChange)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {stats.weeklyActivity?.length > 0 && (
          <View className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <View className="mb-4">
              <Text variant="large" className="font-semibold">
                Hoạt động theo ngày
              </Text>
              <Text variant="small" className="mt-1 text-muted-foreground">
                Số tương tác trong 7 ngày qua
              </Text>
            </View>

            <View
              className="flex-row items-end justify-between gap-2"
              style={{ height: CHART_HEIGHT }}
              accessible
              accessibilityLabel={`Hoạt động 7 ngày qua: ${stats.weeklyActivity
                .map((d) => `${d.label} ${d.value}`)
                .join(', ')}`}>
              {stats.weeklyActivity.map((item) => {
                const height =
                  maxActivity > 0
                    ? Math.max((item.value / maxActivity) * (CHART_HEIGHT - 24), 2)
                    : 2;
                return (
                  <View key={item.label} className="flex-1 items-center gap-1">
                    <Text variant="small" className="text-[10px] text-muted-foreground">
                      {item.value}
                    </Text>
                    <View className="w-full rounded-t bg-primary" style={{ height }} />
                    <Text variant="small" className="text-[10px] text-muted-foreground">
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
