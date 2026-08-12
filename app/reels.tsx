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

  const { userId, start } = useLocalSearchParams<{ userId?: string; start?: string }>();
  const uid = userId ? Number(userId) : undefined;
  const startIndex = Number(start);
  const initialIndex = Number.isFinite(startIndex) && startIndex > 0 ? startIndex : 0;
  const { reels, hasMore, loadMore, loading } = useReels(uid);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(false);
  const [itemHeight, setItemHeight] = useState(SCREEN_H);

  const listRef = useRef<FlatList<IStoryDTO>>(null);
  const jumpedRef = useRef(initialIndex === 0);
  useEffect(() => {
    if (jumpedRef.current || reels.length <= initialIndex) return;
    jumpedRef.current = true;
    listRef.current?.scrollToOffset({ offset: itemHeight * initialIndex, animated: false });
  }, [reels.length, initialIndex, itemHeight]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 });

  const renderItem = useCallback(
    ({ item, index }: { item: IStoryDTO; index: number }) => {
      const active = index === activeIndex;

      const shouldLoad = Math.abs(index - activeIndex) <= 1;

      return (
        <ReelItem
          reel={item}
          active={active}
          shouldLoad={shouldLoad}
          muted={muted}
          height={itemHeight}
          onToggleMute={() => setMuted((m) => !m)}
          onOpenProfile={() => router.push(`/user/${item.user.id}`)}
        />
      );
    },
    [activeIndex, muted, itemHeight, router]
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
    <View className="flex-1 bg-black" onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}>
      <FlatList
        ref={listRef}
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        windowSize={3}
        maxToRenderPerBatch={1}
        initialNumToRender={1}
        removeClippedSubviews={true}
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
  shouldLoad,
  muted,
  height,
  onToggleMute,
  onOpenProfile,
}: {
  reel: IStoryDTO;
  active: boolean;
  shouldLoad: boolean;
  muted: boolean;
  height: number;
  onToggleMute: () => void;
  onOpenProfile: () => void;
}) {
  const videoUrl = resolveMediaUrl(reel.urlVideo);
  const avatar = resolveMediaUrl(reel.user.avatarUrl);

  const player = useVideoPlayer(shouldLoad ? (videoUrl ?? '') : null, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

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
          fullscreenOptions={{ enable: false }}
        />
      )}

      <Pressable
        onPress={onToggleMute}
        className="absolute right-4 top-1/2 size-11 items-center justify-center rounded-full bg-black/40 active:opacity-70">
        <Ionicons
          name={muted ? 'volume-mute' : 'volume-high'}
          size={22}
          color={THEME_COLORS.white}
        />
      </Pressable>

      <SafeAreaView edges={['bottom']} className="pointer-events-none absolute inset-x-0 bottom-0">
        <View className="pointer-events-auto p-4 pb-8">
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
      </SafeAreaView>
    </View>
  );
}
