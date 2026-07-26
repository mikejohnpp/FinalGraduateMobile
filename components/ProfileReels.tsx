// ProfileReels — lưới reel của một người dùng (tab Reels trong hồ sơ).
// Port từ web (src/views/profile/partials/ProfileReel.tsx). Bấm vào 1 reel → mở feed Reels của user đó.
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';
import { useReels } from '@/hooks/useReel';

export function ProfileReels({ userId, isOwner }: { userId: number; isOwner: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();
  const { reels, loading } = useReels(userId);

  // Dọn store khi rời tab để tránh reels của user khác lẫn vào.
  useEffect(() => {
    return () => {
      // reelSlice.clearReels được gọi lại khi useReels mount ở nơi khác.
    };
  }, []);

  if (loading && reels.length === 0) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View className="items-center gap-3 py-10">
        <Text variant="muted">Chưa có reel nào.</Text>
        {isOwner && (
          <Button
            variant="outline"
            className="flex-row gap-1"
            onPress={() => router.push('/reels/create')}>
            <Ionicons name="add" size={18} color={colors.foreground} />
            <Text>Tạo reel</Text>
          </Button>
        )}
      </View>
    );
  }

  return (
    <View className="px-1 pb-4">
      {isOwner && (
        <View className="items-end px-3 py-2">
          <Button
            variant="outline"
            className="flex-row gap-1"
            onPress={() => router.push('/reels/create')}>
            <Ionicons name="add" size={18} color={colors.foreground} />
            <Text>Tạo reel</Text>
          </Button>
        </View>
      )}
      <View className="flex-row flex-wrap">
        {reels.map((reel) => {
          const thumb = resolveMediaUrl(reel.urlImage) ?? resolveMediaUrl(reel.urlVideo);
          return (
            <Pressable
              key={reel.id}
              className="aspect-[9/16] w-1/3 p-1 active:opacity-80"
              onPress={() => router.push(`/reels?userId=${userId}`)}>
              <View className="flex-1 overflow-hidden rounded-lg bg-black">
                {thumb ? (
                  <Image source={{ uri: thumb }} style={{ flex: 1 }} contentFit="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="play" size={28} color={colors.white} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
