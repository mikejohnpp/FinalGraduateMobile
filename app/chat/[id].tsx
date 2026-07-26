// Màn hình cửa sổ chat — port ý tưởng từ web (ChatWindow + MessageList + ChatInput).
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useConversation, useIsUserOnline, useSocketConnection } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import { pickMedia } from '@/lib/imagePicker';
import { uploadPickedMedia } from '@/lib/mediaUpload';
import { resolveMediaUrl } from '@/lib/media';
import { timeAgo } from '@/lib/time';
import { useAppSelector } from '@/store/hooks';
import type { ChatMessage } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

// Ngắt gõ typing sau khoảng lặng.
const TYPING_STOP_DELAY = 2000;

export default function ChatScreen() {
  const colors = useThemeColors();
  // Đảm bảo socket được kết nối ngay cả khi mở thẳng màn này.
  useSocketConnection();

  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const router = useRouter();

  const { chatInfo, messages, typingUsers, loading, loadingOlder, send, sendMedia, loadOlder, setTyping } =
    useConversation(conversationId);
  const userId = useAppSelector((r) => r.user.userId);
  const { startCall } = useWebRTC();

  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        setTyping(true);
      }
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        isTypingRef.current = false;
        setTyping(false);
      }, TYPING_STOP_DELAY);
    },
    [setTyping],
  );

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      setTyping(false);
    }
  }, [setTyping]);

  const handleSend = () => {
    if (!text.trim()) return;
    send(text);
    setText('');
    stopTyping();
  };

  // Chọn ảnh/file → upload Supabase → gửi từng media.
  const handlePickMedia = async () => {
    const picked = await pickMedia(5);
    if (!picked.length) return;
    setUploading(true);
    try {
      for (const item of picked) {
        const media = await uploadPickedMedia(item);
        sendMedia(media);
      }
    } catch (e) {
      console.error('Lỗi khi gửi media:', e);
    } finally {
      setUploading(false);
    }
  };

  const title = chatInfo?.conversationName ?? 'Trò chuyện';
  const someoneTyping = typingUsers.filter((uid: number) => uid !== userId).length > 0;

  const otherMember =
    !chatInfo?.group && chatInfo?.members
      ? chatInfo.members.find((m: any) => m.id !== userId) || chatInfo.members[0]
      : undefined;

  // Chỉ hội thoại 1-1 mới hiển thị trạng thái của đối phương.
  const otherOnline = useIsUserOnline(otherMember?.id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Pressable className="flex-1" onPress={() => router.push(`/chat-info/${conversationId}`)}>
          <Text variant="large" numberOfLines={1}>
            {title}
          </Text>
          {otherMember && (
            <View className="flex-row items-center gap-1">
              <View
                className={`size-2 rounded-full ${otherOnline ? 'bg-green-500' : 'bg-amber-400'}`}
              />
              <Text variant="muted" className="text-xs">
                {otherOnline ? 'Đang hoạt động' : 'Không hoạt động'}
              </Text>
            </View>
          )}
        </Pressable>

        {chatInfo?.group === false && otherMember && (
          <View className="flex-row gap-1">
            <Button
              variant="ghost"
              className="h-auto p-1"
              onPress={() => startCall(otherMember.id, conversationId, false)}>
              <Feather name="phone" size={20} color={colors.foreground} />
            </Button>
            <Button
              variant="ghost"
              className="h-auto p-1"
              onPress={() => startCall(otherMember.id, conversationId, true)}>
              <Feather name="video" size={20} color={colors.foreground} />
            </Button>
          </View>
        )}
        <Button
          variant="ghost"
          className="h-auto p-1"
          onPress={() => router.push(`/chat-info/${conversationId}`)}>
          <Ionicons name="information-circle-outline" size={22} color={colors.foreground} />
        </Button>

      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            inverted
            renderItem={({ item }) => (
              <MessageBubble message={item} isOwn={item.user?.id === userId} />
            )}
            contentContainerClassName="px-4 py-3"
            onEndReached={loadOlder}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingOlder ? (
                <View className="py-3">
                  <ActivityIndicator />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="mt-20 items-center">
                <Text variant="muted">Hãy bắt đầu cuộc trò chuyện.</Text>
              </View>
            }
          />
        )}

        {someoneTyping && (
          <Text variant="muted" className="px-4 pb-1 text-xs">
            Đang nhập...
          </Text>
        )}

        {/* Composer */}
        <View className="flex-row items-center gap-2 border-t border-border px-4 py-2">
          <Button
            variant="ghost"
            className="h-auto p-2"
            disabled={uploading}
            onPress={handlePickMedia}>
            {uploading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Ionicons name="image-outline" size={22} color={colors.foreground} />
            )}
          </Button>
          <TextInput
            className="h-11 flex-1 rounded-full border border-input bg-muted px-4 text-foreground"
            placeholder="Nhắn tin..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={handleTextChange}
            onBlur={stopTyping}
            multiline
            onSubmitEditing={handleSend}
          />
          <Button variant="ghost" className="h-auto p-2" disabled={!text.trim()} onPress={handleSend}>
            <Ionicons
              name="send"
              size={22}
              color={text.trim() ? colors.foreground : colors.mutedForeground}
            />
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const colors = useThemeColors();
  const type = message.messageType ?? 'TEXT';

  // Ảnh — hiển thị thumbnail.
  if (type === 'IMAGE') {
    const uri = resolveMediaUrl(message.content);
    return (
      <View className={isOwn ? 'mb-2 items-end' : 'mb-2 items-start'}>
        {uri && (
          <Image
            source={{ uri }}
            style={{ width: 200, height: 200, borderRadius: 12 }}
            contentFit="cover"
          />
        )}
        <Text variant="muted" className="mt-0.5 text-[10px]">
          {timeAgo(message.createdAt)}
        </Text>
      </View>
    );
  }

  // File — mở link khi bấm.
  if (type === 'FILE') {
    const uri = resolveMediaUrl(message.content);
    const fileName = message.content.split('/').pop() ?? 'Tệp đính kèm';
    return (
      <View className={isOwn ? 'mb-2 items-end' : 'mb-2 items-start'}>
        <Pressable
          className={
            isOwn
              ? 'max-w-[80%] flex-row items-center gap-2 rounded-2xl rounded-br-sm bg-primary px-3 py-2'
              : 'max-w-[80%] flex-row items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2'
          }
          onPress={() => uri && Linking.openURL(uri)}>
          <Ionicons
            name="document-outline"
            size={20}
            color={isOwn ? 'white' : colors.foreground}
          />
          <Text numberOfLines={1} className={isOwn ? 'text-primary-foreground' : 'text-foreground'}>
            {fileName}
          </Text>
        </Pressable>
        <Text variant="muted" className="mt-0.5 text-[10px]">
          {timeAgo(message.createdAt)}
        </Text>
      </View>
    );
  }

  // Nhật ký cuộc gọi.
  if (type === 'VIDEO_CALL' || type === 'AUDIO_CALL') {
    const label = type === 'VIDEO_CALL' ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
    const duration = message.callDuration
      ? ` · ${Math.floor(message.callDuration / 60)}:${String(message.callDuration % 60).padStart(2, '0')}`
      : '';
    return (
      <View className="mb-2 items-center">
        <View className="flex-row items-center gap-1 rounded-full bg-muted px-3 py-1">
          <Ionicons
            name={type === 'VIDEO_CALL' ? 'videocam' : 'call'}
            size={14}
            color={colors.mutedForeground}
          />
          <Text variant="muted" className="text-xs">
            {label}
            {duration}
          </Text>
        </View>
      </View>
    );
  }

  // Văn bản.
  return (
    <View className={isOwn ? 'mb-2 items-end' : 'mb-2 items-start'}>
      <View
        className={
          isOwn
            ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2'
            : 'max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2'
        }>
        <Text className={isOwn ? 'text-primary-foreground' : 'text-foreground'}>
          {message.content}
        </Text>
      </View>
      <Text variant="muted" className="mt-0.5 text-[10px]">
        {timeAgo(message.createdAt)}
      </Text>
    </View>
  );
}
