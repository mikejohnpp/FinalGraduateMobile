import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Text } from '@/components/ui/text';
import { THEME_COLORS } from '@/lib/theme';
import { resolveMediaUrl } from '@/lib/media';
import { useFriendsStories } from '@/hooks/useStory';

const STORY_DURATION = 5000;
const { width: SCREEN_W } = Dimensions.get('window');

function isValidUrl(u?: string | null): u is string {
  return !!u && u !== 'null' && u !== 'undefined';
}

export default function StoriesScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { groupedStories, loading } = useFriendsStories();

  const [groupIndex, setGroupIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!groupedStories.length || !userId) return;
    const idx = groupedStories.findIndex((g) => g.user.id === Number(userId));
    if (idx !== -1) {
      setGroupIndex(idx);
      setStoryIndex(0);
    }
  }, [groupedStories, userId]);

  const activeGroup = groupedStories[groupIndex];
  const activeStory = activeGroup?.stories[storyIndex];
  const hasVideo = isValidUrl(activeStory?.urlVideo);

  const goNext = useCallback(() => {
    if (!activeGroup) return;
    if (storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((p) => p + 1);
    } else if (groupIndex < groupedStories.length - 1) {
      setGroupIndex((p) => p + 1);
      setStoryIndex(0);
    } else {
      router.back();
    }
  }, [activeGroup, storyIndex, groupIndex, groupedStories.length, router]);

  const goPrev = useCallback(() => {
    if (!activeGroup) return;
    if (storyIndex > 0) {
      setStoryIndex((p) => p - 1);
    } else if (groupIndex > 0) {
      const prev = groupedStories[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStoryIndex(prev.stories.length - 1);
    }
  }, [activeGroup, storyIndex, groupIndex, groupedStories]);

  useEffect(() => {
    setProgress(0);
  }, [storyIndex, groupIndex]);

  useEffect(() => {
    if (hasVideo || paused || !activeStory) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const step = 50;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + step / STORY_DURATION;
        if (next >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          goNext();
          return 1;
        }
        return next;
      });
    }, step);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasVideo, paused, activeStory, goNext]);

  if (loading && !groupedStories.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (!activeGroup || !activeStory) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Không có tin nào.</Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary">Đóng</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const imageUrl = resolveMediaUrl(activeStory.urlImage);
  const videoUrl = resolveMediaUrl(activeStory.urlVideo);
  const avatar = resolveMediaUrl(activeGroup.user.avatarUrl);

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row gap-1 px-2 pt-2">
          {activeGroup.stories.map((s, i) => (
            <View key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <View
                className="h-full bg-white"
                style={{
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress * 100}%` : '0%',
                }}
              />
            </View>
          ))}
        </View>

        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable
            onPress={() => router.push(`/user/${activeGroup.user.id}`)}
            className="size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-muted">
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 40, height: 40 }} />
            ) : (
              <Text className="font-bold text-white">
                {activeGroup.user.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </Pressable>
          <Text className="flex-1 font-semibold text-white">{activeGroup.user.username}</Text>
          <Pressable onPress={() => setPaused((p) => !p)} className="p-1">
            <Ionicons name={paused ? 'play' : 'pause'} size={22} color={THEME_COLORS.white} />
          </Pressable>
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="close" size={24} color={THEME_COLORS.white} />
          </Pressable>
        </View>

        <View className="flex-1">
          {(activeStory.color || (activeStory.content && !imageUrl && !hasVideo)) && (
            <View
              className="absolute inset-0 items-center justify-center p-6"
              style={{ backgroundColor: processcolorbe(activeStory.color) || '#1877F2' }}>
              {activeStory.content && !imageUrl && (
                <Text className="text-center text-2xl font-bold text-white">
                  {activeStory.content}
                </Text>
              )}
            </View>
          )}

          {imageUrl && (
            <View className="absolute inset-0">
              <Image source={{ uri: imageUrl }} style={{ flex: 1 }} contentFit="contain" />
            </View>
          )}

          {hasVideo && videoUrl && !imageUrl && !activeStory.color && (
            <StoryVideo url={videoUrl} paused={paused} onProgress={setProgress} onFinish={goNext} />
          )}

          {imageUrl && activeStory.content && (
            <View className="absolute inset-0 items-center justify-center p-6">
              <Text className="text-center text-2xl font-bold text-white">
                {activeStory.content}
              </Text>
            </View>
          )}

          {!activeStory.color && !activeStory.content && !imageUrl && !hasVideo && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-white">Không hiển thị được tin.</Text>
            </View>
          )}

          <View className="absolute inset-0 flex-row">
            <Pressable
              className="flex-1"
              onPress={goPrev}
              onPressIn={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
              style={{ width: SCREEN_W * 0.35 }}
            />
            <Pressable
              className="flex-1"
              onPress={goNext}
              onPressIn={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StoryVideo({
  url,
  paused,
  onProgress,
  onFinish,
}: {
  url: string;
  paused: boolean;
  onProgress: (p: number) => void;
  onFinish: () => void;
}) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [paused, player]);

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = player.duration;
      if (duration && duration > 0) {
        onProgress(player.currentTime / duration);
        if (player.currentTime >= duration - 0.15) {
          onFinish();
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [player, onProgress, onFinish]);

  return (
    <VideoView
      player={player}
      style={{ flex: 1 }}
      contentFit="contain"
      nativeControls={false}
      fullscreenOptions={{ enable: false }}
    />
  );
}

function processcolorbe(text: string | null): string {
  if (text && text.startsWith('l')) {
    return text.split(',')[1] || text;
  }

  return text ? text : '#1877F2';
}
