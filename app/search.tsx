// Màn hình tìm kiếm — port ý tưởng từ web (useSearch). Tìm người dùng + nhóm.
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useSearch,
  type GroupSearchResult,
  type UserSearchResult,
} from '@/hooks/useSearch';
import { resolveMediaUrl } from '@/lib/media';

type Row =
  | { kind: 'header'; title: string }
  | { kind: 'user'; data: UserSearchResult }
  | { kind: 'group'; data: GroupSearchResult };

export default function SearchScreen() {
  const router = useRouter();
  const { results, loading, search, clear } = useSearch();
  const [query, setQuery] = useState('');

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Gộp users + groups thành danh sách phẳng có header để render bằng 1 FlatList.
  const rows: Row[] = [];
  if (results?.users?.length) {
    rows.push({ kind: 'header', title: 'Mọi người' });
    results.users.forEach((u) => rows.push({ kind: 'user', data: u }));
  }
  if (results?.groups?.length) {
    rows.push({ kind: 'header', title: 'Nhóm' });
    results.groups.forEach((g) => rows.push({ kind: 'group', data: g }));
  }

  const hasQuery = query.trim().length > 0;
  const empty = hasQuery && !loading && rows.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header với ô tìm kiếm */}
      <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="hsl(240, 5.9%, 10%)" />
        </Button>
        <View className="flex-1 flex-row items-center gap-2 rounded-full border border-input bg-muted px-3">
          <Ionicons name="search" size={18} color="hsl(240, 3.8%, 46.1%)" />
          <TextInput
            className="h-10 flex-1 text-foreground"
            placeholder="Tìm người dùng, nhóm..."
            placeholderTextColor="hsl(240, 3.8%, 46.1%)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery('');
                clear();
              }}>
              <Ionicons name="close-circle" size={18} color="hsl(240, 3.8%, 46.1%)" />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, i) =>
          item.kind === 'header' ? `h-${item.title}` : `${item.kind}-${item.data.id}-${i}`
        }
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <Text variant="muted" className="bg-muted/50 px-4 py-1.5 text-xs font-semibold">
                {item.title}
              </Text>
            );
          }
          if (item.kind === 'user') {
            const u = item.data;
            const avatar = resolveMediaUrl(u.avatar);
            const name = u.nickName || u.name;
            return (
              <Pressable
                className="flex-row items-center gap-3 px-4 py-3 active:bg-muted"
                onPress={() => router.push(`/user/${u.id}`)}>
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="size-11 items-center justify-center rounded-full bg-muted">
                    <Text className="font-semibold text-muted-foreground">
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text className="flex-1 font-medium" numberOfLines={1}>
                  {name}
                </Text>
                <Ionicons name="person-outline" size={18} color="hsl(240, 3.8%, 46.1%)" />
              </Pressable>
            );
          }
          const g = item.data;
          const avatar = resolveMediaUrl(g.avatar);
          return (
            <Pressable
              className="flex-row items-center gap-3 px-4 py-3 active:bg-muted"
              onPress={() => router.push(`/group/${g.id}`)}>
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={{ width: 44, height: 44, borderRadius: 8 }}
                  contentFit="cover"
                />
              ) : (
                <View className="size-11 items-center justify-center rounded-lg bg-muted">
                  <Ionicons name="people" size={20} color="hsl(240, 3.8%, 46.1%)" />
                </View>
              )}
              <View className="flex-1">
                <Text className="font-medium" numberOfLines={1}>
                  {g.name}
                </Text>
                <Text variant="muted" className="text-xs">
                  {g.memberCount} thành viên
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="mt-20 items-center px-6">
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text variant="muted" className="text-center">
                {empty ? 'Không tìm thấy kết quả nào.' : 'Nhập từ khoá để tìm kiếm.'}
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          loading && rows.length > 0 ? (
            <View className="py-3">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
