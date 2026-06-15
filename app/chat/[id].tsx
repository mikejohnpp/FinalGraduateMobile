// Màn hình cửa sổ chat — port ý tưởng từ web (ChatWindow + MessageList + ChatInput).
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useConversation, useSocketConnection } from '@/hooks/useChat';
import { timeAgo } from '@/lib/time';
import { useAppSelector } from '@/store/hooks';
import type { ChatMessage } from '@/types';

export default function ChatScreen() {
  // Đảm bảo socket được kết nối ngay cả khi mở thẳng màn này.
  useSocketConnection();

  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const router = useRouter();

  const { chatInfo, messages, typingUsers, loading, send } = useConversation(conversationId);
  const userId = useAppSelector((r) => r.user.userId);

  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    send(text);
    setText('');
  };

  const title = chatInfo?.conversationName ?? 'Trò chuyện';
  const someoneTyping = typingUsers.filter((uid: number) => uid !== userId).length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="hsl(240, 5.9%, 10%)" />
        </Button>
        <Text variant="large" numberOfLines={1} className="flex-1">
          {title}
        </Text>
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
          <TextInput
            className="h-11 flex-1 rounded-full border border-input bg-muted px-4 text-foreground"
            placeholder="Nhắn tin..."
            placeholderTextColor="hsl(240, 3.8%, 46.1%)"
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={handleSend}
          />
          <Button
            variant="ghost"
            className="h-auto p-2"
            disabled={!text.trim()}
            onPress={handleSend}>
            <Ionicons
              name="send"
              size={22}
              color={text.trim() ? 'hsl(240, 5.9%, 10%)' : 'hsl(240, 3.8%, 46.1%)'}
            />
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
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
