import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import { pickVideo } from '@/lib/imagePicker';
import { useCreateReel } from '@/hooks/useReel';

export default function CreateReelScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { create, loading } = useCreateReel();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoMime, setVideoMime] = useState<string | null>(null);
  const [content, setContent] = useState('');

  const handlePick = async () => {
    const res = await pickVideo();
    if (res) {
      setVideoUri(res.uri);
      setVideoMime(res.mimeType ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!videoUri) return;
    const reel = await create(videoUri, videoMime, content.trim() || undefined);
    if (reel) router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70">
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>
          <Text variant="large">Tạo Reel</Text>
        </View>

        <ScrollView
          contentContainerClassName="flex-grow p-4 gap-4"
          keyboardShouldPersistTaps="handled">
          {videoUri ? (
            <View className="h-96 overflow-hidden rounded-2xl bg-black">
              <VideoPreview uri={videoUri} />
            </View>
          ) : (
            <Pressable
              onPress={handlePick}
              className="h-96 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted active:opacity-70">
              <Ionicons name="videocam" size={40} color={colors.mutedForeground} />
              <Text variant="muted" className="mt-2">
                Chọn video từ thư viện
              </Text>
            </Pressable>
          )}

          {videoUri && (
            <Button variant="outline" className="flex-row gap-1" onPress={handlePick}>
              <Ionicons name="swap-horizontal" size={18} color={colors.foreground} />
              <Text>Đổi video</Text>
            </Button>
          )}

          <TextInput
            className="min-h-[60px] rounded-xl border border-border p-3 text-base text-foreground"
            placeholder="Thêm chú thích (tuỳ chọn)"
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <Button
            className="mt-2 flex-row gap-2"
            disabled={!videoUri || loading}
            onPress={handleSubmit}>
            {loading && <ActivityIndicator size="small" color={colors.primaryForeground} />}
            <Text className="text-primary-foreground">
              {loading ? 'Đang đăng...' : 'Đăng Reel'}
            </Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });
  return <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />;
}
