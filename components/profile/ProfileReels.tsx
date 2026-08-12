import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';
import { useUserReels } from '@/hooks/useReel';
import type { IStoryDTO } from '@/types';

interface ProfileReelsProps {
  userId: number;
  isOwner: boolean;
}

export function ProfileReels({ userId, isOwner }: ProfileReelsProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { reels, loading, hasMore, loadMore } = useUserReels(userId);

  const openReel = (index: number) => {
    router.push(`/reels?userId=${userId}&start=${index}`);
  };

  return (
    <View className="bg-card pb-4">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <Text variant="large">Reels</Text>
        {isOwner && (
          <Button
            variant="link"
            className="h-auto flex-row gap-1 px-2 py-1"
            accessibilityLabel="Tạo thước phim"
            onPress={() => router.push('/reels/create')}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text className="font-semibold text-primary">Tạo thước phim</Text>
          </Button>
        )}
      </View>

      {loading && reels.length === 0 ? (
        <View className="items-center py-10">
          <ActivityIndicator />
        </View>
      ) : reels.length === 0 ? (
        <View className="items-center py-10">
          <Text variant="muted">
            {isOwner ? 'Bạn chưa tạo thước phim nào.' : 'Người này chưa có thước phim nào.'}
          </Text>
        </View>
      ) : (
        <>
          <View className="flex-row flex-wrap px-1">
            {reels.map((reel, index) => (
              <Pressable
                key={reel.id}
                accessibilityRole="button"
                accessibilityLabel="Xem thước phim"
                className="aspect-[9/16] w-1/3 p-1 active:opacity-80"
                onPress={() => openReel(index)}>
                <ReelThumbnail reel={reel} />
              </Pressable>
            ))}
          </View>

          {hasMore && (
            <View className="mt-3 items-center">
              <Button variant="outline" disabled={loading} onPress={loadMore}>
                <Text>{loading ? 'Đang tải...' : 'Xem thêm'}</Text>
              </Button>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function ReelThumbnail({ reel }: { reel: IStoryDTO }) {
  const imageUri = resolveMediaUrl(reel.urlImage);
  const videoUri = resolveMediaUrl(reel.urlVideo);

  return (
    <View className="flex-1 overflow-hidden rounded-xl bg-black">
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ flex: 1 }} contentFit="cover" />
      ) : videoUri ? (
        <VideoFirstFrame uri={videoUri} />
      ) : null}

      <View className="absolute bottom-1.5 left-1.5 flex-row items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5">
        <Ionicons name="play" size={11} color="#ffffff" />
      </View>
    </View>
  );
}

function VideoFirstFrame({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.pause();
  });

  return (
    <VideoView
      player={player}
      style={{ flex: 1 }}
      contentFit="cover"
      nativeControls={false}
      fullscreenOptions={{ enable: false }}
    />
  );
}
