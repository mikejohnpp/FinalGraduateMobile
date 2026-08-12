import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupMemberRequests } from '@/hooks/useGroupAdmin';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';
import { goBackOr } from '@/lib/navigation';
import { formatYear } from '@/lib/text';
import type { IGroupAdminMember } from '@/types';

const GENDER_OPTIONS: { value: 'ALL' | 'MALE' | 'FEMALE' | 'OTHER'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export default function GroupAdminMemberRequestsScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openProfile = useOpenProfile();
  const {
    members,
    loading,
    approve,
    reject,
    loadMore,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    genderFilter,
    setGenderFilter,
  } = useGroupMemberRequests(id);

  const [searchInput, setSearchInput] = useState(searchQuery);

  const renderItem = ({ item }: { item: IGroupAdminMember }) => {
    const avatarUri = resolveMediaUrl(item.avatarUrl);
    return (
      <View className="mb-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem hồ sơ của ${item.username}`}
          className="mb-3 flex-row items-center gap-3 active:opacity-70"
          onPress={() => openProfile(item.userId)}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              contentFit="cover"
            />
          ) : (
            <View className="size-12 items-center justify-center rounded-full bg-muted">
              <Text className="text-lg font-semibold text-muted-foreground">
                {item.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="font-semibold">{item.username}</Text>
            {item.joinedPlatformAt && (
              <Text variant="small" className="text-muted-foreground">
                Đã tham gia nền tảng từ {formatYear(item.joinedPlatformAt)}
              </Text>
            )}
          </View>
        </Pressable>
        <View className="flex-row gap-2">
          <Button className="flex-1" onPress={() => approve(item.id)}>
            <Text className="text-primary-foreground">Phê duyệt</Text>
          </Button>
          <Button variant="outline" className="flex-1" onPress={() => reject(item.id)}>
            <Text>Từ chối</Text>
          </Button>
        </View>
      </View>
    );
  };

  const filters = (
    <View className="mb-3 gap-3">
      <View className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
        <Ionicons name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          className="flex-1 py-2.5 text-base text-foreground"
          placeholder="Tìm theo tên..."
          placeholderTextColor={colors.mutedForeground}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearchQuery(searchInput.trim())}
          returnKeyType="search"
          accessibilityLabel="Tìm kiếm yêu cầu theo tên"
        />
        {searchInput.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xoá từ khoá tìm kiếm"
            hitSlop={8}
            onPress={() => {
              setSearchInput('');
              setSearchQuery('');
            }}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-2">
        {(
          [
            ['newest', 'Mới nhất'],
            ['oldest', 'Cũ nhất'],
          ] as ['newest' | 'oldest', string][]
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={sortOrder === value ? 'default' : 'outline'}
            className="flex-1"
            onPress={() => setSortOrder(value)}>
            <Text
              className={`text-xs ${sortOrder === value ? 'text-primary-foreground' : 'text-foreground'}`}>
              {label}
            </Text>
          </Button>
        ))}
      </View>

      <View className="flex-row gap-2">
        {GENDER_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={genderFilter === value ? 'default' : 'outline'}
            className="flex-1"
            onPress={() => setGenderFilter(value)}>
            <Text
              className={`text-xs ${genderFilter === value ? 'text-primary-foreground' : 'text-foreground'}`}>
              {label}
            </Text>
          </Button>
        ))}
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
        <Text variant="large">Yêu cầu tham gia</Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerClassName="p-4"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={filters}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-10 opacity-70">
              <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
              <Text variant="large" className="mt-2 text-muted-foreground">
                Không có yêu cầu nào
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
