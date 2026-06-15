// FriendRow — một hàng người dùng với avatar, tên, số bạn chung và các nút hành động.
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { resolveMediaUrl } from '@/lib/media';
import type { IAuthor } from '@/types';

interface FriendRowProps {
  user: IAuthor;
  subtitle?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  disabled?: boolean;
}

export function FriendRow({
  user,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  disabled,
}: FriendRowProps) {
  const avatarUri = resolveMediaUrl(user.avatar);
  const displayName = user.nickName || user.name;

  return (
    <View className="flex-row items-center gap-3 bg-card px-4 py-3">
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
      ) : (
        <View className="size-12 items-center justify-center rounded-full bg-muted">
          <Text className="font-semibold text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="font-semibold" numberOfLines={1}>
          {displayName}
        </Text>
        {!!subtitle && (
          <Text variant="muted" className="text-xs">
            {subtitle}
          </Text>
        )}
      </View>

      <View className="flex-row gap-2">
        {primaryLabel && (
          <Button size="sm" disabled={disabled} onPress={onPrimary}>
            <Text className="text-xs text-primary-foreground">{primaryLabel}</Text>
          </Button>
        )}
        {secondaryLabel && (
          <Button size="sm" variant="secondary" disabled={disabled} onPress={onSecondary}>
            <Text className="text-xs">{secondaryLabel}</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
