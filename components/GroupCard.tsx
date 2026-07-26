// GroupCard — thẻ một nhóm với ảnh bìa, tên, số thành viên và nút hành động.
// Đồng bộ hành vi với web (GroupCard.tsx): ADMIN thấy nút "Quản lý" thay cho tham gia/rời nhóm,
// và hiển thị số bạn bè cùng nhóm khi có.
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import type { IGroup } from '@/types';

interface GroupCardProps {
  group: IGroup;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  onManage?: () => void;
  actionLoading?: boolean;
}

export function GroupCard({
  group,
  onPress,
  onJoin,
  onLeave,
  onManage,
  actionLoading,
}: GroupCardProps) {
  const coverUri = resolveMediaUrl(group.coverPhoto || group.avatar);
  const privacyLabel = group.privacy === 'public' ? 'Công khai' : 'Riêng tư';
  const isAdmin = group.role === 'ADMIN';

  return (
    <View className="overflow-hidden rounded-xl bg-card">
      <Button variant="ghost" className="h-auto flex-col items-stretch p-0" onPress={onPress}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={{ width: '100%', height: 120 }} contentFit="cover" />
        ) : (
          // Nền tint primary để phân biệt rõ với nền trang (muted trùng tông với background).
          <View className="h-[120px] w-full items-center justify-center bg-primary/10">
            <Text className="text-4xl font-bold uppercase text-primary">
              {group.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        <View className="gap-1 p-3">
          <Text className="font-semibold" numberOfLines={1}>
            {group.name}
          </Text>
          <Text variant="muted" className="text-xs">
            {privacyLabel} · {group.memberCount} thành viên
          </Text>
          {/* Bạn bè cùng nhóm — như web, chỉ hiện khi > 0 */}
          {group.mutualFriendCount > 0 && (
            <Text variant="muted" className="text-xs">
              {group.mutualFriendCount} bạn bè là thành viên
            </Text>
          )}
        </View>
      </Button>

      <View className="px-3 pb-3">
        {isAdmin ? (
          <Button variant="secondary" size="sm" onPress={onManage ?? onPress}>
            <Text className="text-xs">Quản lý</Text>
          </Button>
        ) : group.isJoined ? (
          <Button variant="secondary" size="sm" disabled={actionLoading} onPress={onLeave}>
            <Text className="text-xs">Rời nhóm</Text>
          </Button>
        ) : group.isPending ? (
          <Button variant="outline" size="sm" disabled>
            <Text className="text-xs text-muted-foreground">Đang chờ duyệt</Text>
          </Button>
        ) : (
          <Button size="sm" disabled={actionLoading} onPress={onJoin}>
            <Text className="text-xs text-primary-foreground">Tham gia</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
