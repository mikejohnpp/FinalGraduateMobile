// Màn hình Reels — port từ web (src/views/reels/Reels.tsx).
// Feed video dọc, vuốt lên/xuống để chuyển reel; video tự phát khi đang hiển thị.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, View, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Text } from '@/components/ui/text';
import { THEME_COLORS } from '@/lib/theme';
import { resolveMediaUrl } from '@/lib/media';
import { useReels } from '@/hooks/useReel';
import type { IStoryDTO } from '@/types';

const { height: SCREEN_H } = Dimensions.get('window');

export default function ReelsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const uid = userId ? Number(userId) : undefined;
  const { reels, hasMore, loadMore, loading } = useReels(uid);

  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [itemHeight, setItemHeight] = useState(SCREEN_H);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 });

  const renderItem = useCallback(
    ({ item, index }: { item: IStoryDTO; index: number }) => (
      <ReelItem
        reel={item}
        active={index === activeIndex}
        muted={muted}
        height={itemHeight}
        onToggleMute={() => setMuted((m) => !m)}
        onOpenProfile={() => router.push(`/user/${item.user.id}`)}
      />
    ),
    [activeIndex, muted, itemHeight, router],
  );

  if (!loading && reels.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Không có thước phim nào</Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary">Đóng</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-black"
      onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}>
      <FlatList
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        onEndReached={() => hasMore && !loading && loadMore()}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />

      {/* Nút đóng */}
      <SafeAreaView className="absolute left-0 top-0" edges={['top']}>
        <Pressable
          onPress={() => router.back()}
          className="m-4 size-10 items-center justify-center rounded-full bg-black/50 active:opacity-70">
          <Ionicons name="close" size={24} color={THEME_COLORS.white} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function ReelItem({
  reel,
  active,
  muted,
  height,
  onToggleMute,
  onOpenProfile,
}: {
  reel: IStoryDTO;
  active: boolean;
  muted: boolean;
  height: number;
  onToggleMute: () => void;
  onOpenProfile: () => void;
}) {
  const videoUrl = resolveMediaUrl(reel.urlVideo);
  const avatar = resolveMediaUrl(reel.user.avatarUrl);

  // Trình phát của expo-video: lặp lại, mặc định không hiện điều khiển.
  const player = useVideoPlayer(videoUrl ?? '', (p) => {
    p.loop = true;
    p.muted = muted;
  });

  // Chỉ phát reel đang hiển thị; các reel khác tạm dừng để tiết kiệm tài nguyên.
  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  // Đồng bộ trạng thái tắt/mở tiếng.
  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  return (
    <View style={{ height }} className="bg-black">
      {videoUrl && (
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
        />
      )}


      {/* Nút tắt/mở tiếng */}
      <Pressable
        onPress={onToggleMute}
        className="absolute right-4 top-1/2 size-11 items-center justify-center rounded-full bg-black/40 active:opacity-70">
        <Ionicons
          name={muted ? 'volume-mute' : 'volume-high'}
          size={22}
          color={THEME_COLORS.white}
        />
      </Pressable>

      {/* Thông tin tác giả + chú thích */}
      <View className="absolute inset-x-0 bottom-0 p-4 pb-8">
        <Pressable className="flex-row items-center gap-3" onPress={onOpenProfile}>
          <View className="size-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-muted">
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 40, height: 40 }} />
            ) : (
              <Text className="font-bold text-white">
                {reel.user.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="text-base font-semibold text-white">{reel.user.username}</Text>
        </Pressable>
        {reel.content ? (
          <Text numberOfLines={2} className="mt-2 text-sm text-white/90">
            {reel.content}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
