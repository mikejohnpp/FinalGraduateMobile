import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useMessageNotification } from '@/hooks/useMessageNotification';
import { resolveMediaUrl } from '@/lib/media';
import type { MessageNotification } from '@/types';

function previewContent(notification: MessageNotification): string {
  switch (notification.messageType) {
    case 'IMAGE':
      return 'Đã gửi một ảnh';
    case 'FILE':
      return 'Đã gửi một tệp';
    case 'VIDEO_CALL':
    case 'AUDIO_CALL':
      return notification.content || 'Cuộc gọi';
    default:
      return notification.content || '';
  }
}

export default function MessageNotificationBanner() {
  const { current, dismiss } = useMessageNotification();
  const router = useRouter();

  if (!current) return null;

  const title = current.isGroup
    ? current.conversationName || 'Nhóm chat'
    : (current.sender?.username ?? 'Tin nhắn mới');
  const subtitle = current.isGroup
    ? `${current.sender?.username ?? ''}: ${previewContent(current)}`
    : previewContent(current);
  const avatarUri = resolveMediaUrl(current.sender?.avatarUrl);

  const openConversation = () => {
    dismiss();
    router.push(`/chat/${current.conversationId}`);
  };

  return (
    <SafeAreaView
      edges={['top']}
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tin nhắn mới từ ${title}. Nhấn để mở hội thoại.`}
        onPress={openConversation}
        className="mx-3 mt-2 flex-row items-center gap-3 rounded-2xl bg-card px-3 py-3 shadow-lg"
        style={{
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}>
        <View className="size-11 overflow-hidden rounded-full bg-muted">
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-primary/10">
              <Text className="text-base font-bold uppercase text-primary">
                {title.charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="muted" className="text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng thông báo"
          hitSlop={8}
          onPress={dismiss}
          className="p-1">
          <Feather name="x" size={18} color="#9ca3af" />
        </Pressable>
      </Pressable>
    </SafeAreaView>
  );
}
