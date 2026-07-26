// GroupRow — dòng nhóm gọn (avatar vuông + tên + phụ đề), dùng cho danh sách "Nhóm của bạn".
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import type { IGroup } from '@/types';

interface GroupRowProps {
  group: IGroup;
  onPress?: () => void;
  /** Nút phụ bên phải (ví dụ "Quản lý"), tuỳ chọn. */
  right?: React.ReactNode;
}

export function GroupRow({ group, onPress, right }: GroupRowProps) {
  const uri = resolveMediaUrl(group.avatar || group.coverPhoto);
  const privacyLabel = group.privacy === 'public' ? 'Công khai' : 'Riêng tư';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở nhóm ${group.name}`}
      className="flex-row items-center gap-3 bg-card px-4 py-3 active:bg-muted"
      onPress={onPress}>
      <View className="size-14 overflow-hidden rounded-xl bg-muted">
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          // Nền tint primary cho chữ cái đầu — nổi rõ trên nền thẻ.
          <View className="flex-1 items-center justify-center bg-primary/10">
            <Text className="text-xl font-bold uppercase text-primary">
              {group.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="font-semibold" numberOfLines={2}>
          {group.name}
        </Text>
        <Text variant="muted" className="text-xs">
          {privacyLabel} · {group.memberCount} thành viên
        </Text>
      </View>

      {right}
    </Pressable>
  );
}
