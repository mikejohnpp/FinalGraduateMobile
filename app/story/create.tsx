// Màn hình tạo tin (Story) — port từ web (src/views/story/CreateStory.tsx).
// Hỗ trợ 3 loại: text (màu nền + chữ), image (ảnh + chú thích), video.
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
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import { STORY_BG_COLORS } from '@/lib/storyColors';
import { pickImageWithMeta, pickVideo } from '@/lib/imagePicker';
import { useCreateStory, type StoryComposeType } from '@/hooks/useStory';

export default function CreateStoryScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { create, loading } = useCreateStory();

  const [storyType, setStoryType] = useState<StoryComposeType | null>(null);
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(STORY_BG_COLORS[0].value);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState('');

  const reset = () => {
    setStoryType(null);
    setTextContent('');
    setMediaUri(null);
    setMediaMime(null);
    setOverlayText('');
  };

  const handleBack = () => (storyType !== null ? reset() : router.back());

  const handlePickImage = async () => {
    const res = await pickImageWithMeta();
    if (res) {
      setMediaUri(res.uri);
      setMediaMime(res.mimeType ?? null);
      setStoryType('image');
    }
  };

  const handlePickVideo = async () => {
    const res = await pickVideo();
    if (res) {
      setMediaUri(res.uri);
      setMediaMime(res.mimeType ?? null);
      setStoryType('video');
    }
  };

  const handleSubmit = async () => {
    if (!storyType) return;
    const story = await create({
      storyType,
      textContent,
      color: selectedBg,
      mediaUri,
      mediaMime,
      overlayText,
    });
    if (story) {
      reset();
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="size-9 items-center justify-center rounded-full bg-muted active:opacity-70">
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>
          <Text variant="large">{storyType === null ? 'Tạo tin' : 'Xem trước'}</Text>
        </View>

        <ScrollView contentContainerClassName="flex-grow p-4 gap-4" keyboardShouldPersistTaps="handled">
          {storyType === null && (
            <View className="gap-3">
              <Text variant="muted">Chọn loại tin muốn tạo</Text>

              <TypeOption
                icon="text"
                label="Tin văn bản"
                desc="Chia sẻ suy nghĩ với nền màu"
                onPress={() => setStoryType('text')}
              />
              <TypeOption
                icon="image"
                label="Tin ảnh"
                desc="Đăng một tấm ảnh kèm chú thích"
                onPress={handlePickImage}
              />
              <TypeOption
                icon="videocam"
                label="Tin video"
                desc="Đăng một video ngắn"
                onPress={handlePickVideo}
              />
            </View>
          )}

          {storyType === 'text' && (
            <View className="gap-4">
              {/* Preview */}
              <View
                className="h-80 items-center justify-center rounded-2xl p-6"
                style={{ backgroundColor: selectedBg }}>
                <Text className="text-center text-2xl font-bold text-white">
                  {textContent || 'Nhập nội dung...'}
                </Text>
              </View>

              <TextInput
                className="min-h-[60px] rounded-xl border border-border p-3 text-base text-foreground"
                placeholder="Bạn đang nghĩ gì?"
                placeholderTextColor={colors.mutedForeground}
                value={textContent}
                onChangeText={setTextContent}
                multiline
                textAlignVertical="top"
                autoFocus
              />

              {/* Bảng màu */}
              <View>
                <Text variant="muted" className="mb-2">
                  Màu nền
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {STORY_BG_COLORS.map((c) => (
                    <Pressable
                      key={c.value}
                      onPress={() => setSelectedBg(c.value)}
                      className="size-10 rounded-full active:opacity-70"
                      style={{
                        backgroundColor: c.value,
                        borderWidth: selectedBg === c.value ? 3 : 0,
                        borderColor: colors.foreground,
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {(storyType === 'image' || storyType === 'video') && mediaUri && (
            <View className="gap-4">
              <View className="h-80 overflow-hidden rounded-2xl bg-black">
                {storyType === 'image' ? (
                  <Image source={{ uri: mediaUri }} style={{ flex: 1 }} contentFit="contain" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="videocam" size={48} color={colors.white} />
                    <Text className="mt-2 text-white">Đã chọn video</Text>
                  </View>
                )}
              </View>

              {storyType === 'image' && (
                <TextInput
                  className="min-h-[48px] rounded-xl border border-border p-3 text-base text-foreground"
                  placeholder="Thêm chú thích (tuỳ chọn)"
                  placeholderTextColor={colors.mutedForeground}
                  value={overlayText}
                  onChangeText={setOverlayText}
                  multiline
                  textAlignVertical="top"
                />
              )}
            </View>
          )}

          {storyType !== null && (
            <Button className="mt-2 flex-row gap-2" disabled={loading} onPress={handleSubmit}>
              {loading && <ActivityIndicator size="small" color={colors.primaryForeground} />}
              <Text className="text-primary-foreground">
                {loading ? 'Đang đăng...' : 'Chia sẻ tin'}
              </Text>
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypeOption({
  icon,
  label,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border p-4 active:opacity-70">
      <View className="size-11 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold">{label}</Text>
        <Text variant="muted" className="text-sm">
          {desc}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
