// StoriesBar — thanh tin (story) ngang trên đầu feed. Port từ web (StoriesBar.tsx).
// Bấm ô "Tạo tin" → điều hướng sang màn hình tạo tin; bấm ô story → mở viewer.
import { FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import { useThemeColors } from '@/hooks/useTheme';
import { useFriendsStories } from '@/hooks/useStory';
import type { IGroupedStory } from '@/types';

export function StoriesBar() {
  const router = useRouter();
  const { groupedStories } = useFriendsStories();

  return (
    <View className="bg-card py-3">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={groupedStories}
        keyExtractor={(g) => String(g.user.id)}
        contentContainerClassName="gap-2 px-3"
        ListHeaderComponent={<CreateStoryTile onPress={() => router.push('/story/create')} />}
        renderItem={({ item }) => (
          <StoryTile group={item} onPress={() => router.push(`/stories?userId=${item.user.id}`)} />
        )}
      />
    </View>
  );
}

function CreateStoryTile({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="h-40 w-24 overflow-hidden rounded-xl border border-border bg-muted">
        <View className="flex-1 items-center justify-center">
          <View className="size-10 items-center justify-center rounded-full bg-primary">
            <Ionicons name="add" size={22} color={colors.primaryForeground} />
          </View>
        </View>
        <Text className="pb-2 text-center text-xs font-semibold">Tạo tin</Text>
      </View>
    </Pressable>
  );
}

function StoryTile({ group, onPress }: { group: IGroupedStory; onPress: () => void }) {
  const colors = useThemeColors();
  const latest = group.stories[0];
  const bgImage = resolveMediaUrl(latest.urlImage);
  const avatar = resolveMediaUrl(group.user.avatarUrl);

  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="h-40 w-24 overflow-hidden rounded-xl border border-border">
        {bgImage ? (
          <Image source={{ uri: bgImage }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View
            className="flex-1"
            style={{ backgroundColor: latest.color ?? colors.primary }}
          />
        )}

        {/* Avatar tròn ở góc trên */}
        <View className="absolute left-2 top-2 size-9 items-center justify-center rounded-full border-2 border-primary bg-muted">
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Text className="text-sm font-bold">{group.user.username.charAt(0).toUpperCase()}</Text>
          )}
        </View>

        {/* Tên người dùng ở đáy */}
        <View className="absolute inset-x-0 bottom-0 bg-black/30 px-1.5 py-1">
          <Text numberOfLines={1} className="text-xs font-semibold text-white">
            {group.user.username}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
