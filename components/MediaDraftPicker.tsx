import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import type { DraftMedia } from '@/hooks/useMediaUpload';

interface MediaDraftPickerProps {
  drafts: DraftMedia[];
  onPick: () => void;
  onRemove: (id: string) => void;
  disabled?: boolean;

  variant?: 'icon' | 'button';
}

export default function MediaDraftPicker({
  drafts,
  onPick,
  onRemove,
  disabled,
  variant = 'button',
}: MediaDraftPickerProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-2">
      {drafts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2">
          {drafts.map((d) => (
            <View key={d.id} style={{ width: 84, height: 84 }}>
              {d.mediaType === 'VIDEO' ? (
                <View
                  className="items-center justify-center rounded-lg bg-black"
                  style={{ width: 84, height: 84 }}>
                  <Ionicons name="play-circle" size={32} color="#ffffff" />
                </View>
              ) : (
                <Image
                  source={{ uri: d.uri }}
                  style={{ width: 84, height: 84, borderRadius: 8 }}
                  contentFit="cover"
                />
              )}
              <Pressable
                onPress={() => onRemove(d.id)}
                style={{ position: 'absolute', top: -6, right: -6 }}
                hitSlop={8}>
                <Ionicons name="close-circle" size={22} color="hsl(0,84.2%,60.2%)" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {variant === 'icon' ? (
        <Pressable onPress={onPick} disabled={disabled} hitSlop={8}>
          <Ionicons
            name="image-outline"
            size={24}
            color={disabled ? colors.mutedForeground : 'hsl(142,71%,45%)'}
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={onPick}
          disabled={disabled}
          className="flex-row items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3">
          <Ionicons name="image-outline" size={20} color="hsl(142,71%,45%)" />
          <Text className="text-sm text-muted-foreground">Thêm ảnh/video</Text>
        </Pressable>
      )}
    </View>
  );
}
