import { FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import { useThemeColors } from '@/hooks/useTheme';
import { useFriendsStories } from '@/hooks/useStory';
import type { IGroupedStory } from '@/types';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { LinearGradient } from 'expo-linear-gradient';

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
  const userAvatar = useSelector((s: RootState) => s.user.profile?.avatar);
  const avatarUri = resolveMediaUrl(userAvatar);
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="h-40 w-24 overflow-hidden rounded-xl border border-border bg-card">
        <View className="h-3/4 w-full bg-muted">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="person" size={32} color={colors.mutedForeground} />
            </View>
          )}
        </View>

        <View className="relative h-1/4 items-center justify-end bg-card pb-1.5">
          <View
            className="absolute -top-4 size-8 items-center justify-center rounded-full bg-primary"
            style={{ borderWidth: 3, borderColor: colors.card }}>
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
          </View>
          <Text className="text-center text-xs font-semibold">Tạo tin</Text>
        </View>
      </View>
    </Pressable>
  );
}

function StoryTile({ group, onPress }: { group: IGroupedStory; onPress: () => void }) {
  const colors = useThemeColors();
  const latest = group.stories[0];
  const bgImage = resolveMediaUrl(latest.urlImage);
  const bgVideo = resolveMediaUrl(latest.urlVideo);
  const avatar = resolveMediaUrl(group.user.avatarUrl);

  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="h-40 w-24 overflow-hidden rounded-xl border border-border">
        {bgImage ? (
          <Image source={{ uri: bgImage }} style={{ flex: 1 }} contentFit="cover" />
        ) : bgVideo && !latest.content ? (
          <View className="flex-1 items-center justify-center bg-black">
            <Ionicons name="play-circle" size={32} color="white" />
          </View>
        ) : (
          <View
            className="flex-1 items-center justify-center px-2"
            style={{ backgroundColor: processcolorbe(latest.color) }}>
            {latest.content ? (
              <Text numberOfLines={3} className="text-center text-xs font-bold text-white">
                {latest.content}
              </Text>
            ) : null}
          </View>
        )}

        <View
          className="absolute inset-0"
          style={{
            backgroundColor: 'transparent',
          }}>
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.4, 1]}
            style={{ flex: 1 }}
          />
        </View>

        <View className="absolute left-2 top-2 size-9 items-center justify-center rounded-full border-2 border-primary bg-muted">
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Text className="text-sm font-bold">{group.user.username.charAt(0).toUpperCase()}</Text>
          )}
        </View>

        <View className="absolute inset-x-0 bottom-0 px-1.5 py-1">
          <Text numberOfLines={1} className="text-xs font-semibold text-white">
            {group.user.username}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function processcolorbe(text: string | null): string {
  if (text && text.startsWith('l')) {
    return text.split(',')[1] || text;
  }

  return text ? text : '#1877F2';
}
