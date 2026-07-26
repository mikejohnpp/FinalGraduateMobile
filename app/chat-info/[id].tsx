// Màn thông tin hội thoại — port ý tưởng từ web (InfoPanel + MediaManagerConversation + AddMemberDialog).
// Gồm: danh sách thành viên, thêm thành viên (nhóm), quản lý ảnh/file đã chia sẻ.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import chatService from '@/services/chatService';
import friendService from '@/services/friendService';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import { API } from '@/lib/constants';

import { resolveMediaUrl } from '@/lib/media';
import { useAppSelector } from '@/store/hooks';
import type { ChatMessage, CursorPageResponse, IFriendship, MessageChat } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

export default function ChatInfoScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const router = useRouter();
  const openProfile = useOpenProfile();
  const userId = useAppSelector((r) => r.user.userId);


  const [detail, setDetail] = useState<MessageChat | null>(null);
  const [media, setMedia] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState<'IMAGE' | 'FILE'>('IMAGE');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!conversationId) return;
    try {
      const [d, m] = await Promise.all([
        chatService.getConversationDetail(conversationId),
        chatService.getConversationMedia(conversationId),
      ]);
      setDetail(d);
      setMedia(m?.messages ?? []);
    } catch (e) {
      console.error('Lỗi khi tải thông tin hội thoại:', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const images = useMemo(() => media.filter((m) => m.messageType === 'IMAGE'), [media]);
  const files = useMemo(() => media.filter((m) => m.messageType === 'FILE'), [media]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const isGroup = detail?.group ?? false;
  const members = detail?.members ?? [];
  const title = detail?.conversationName ?? 'Thông tin';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-border px-4 py-2">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large" numberOfLines={1} className="flex-1">
          {title}
        </Text>
      </View>

      <FlatList
        data={tab === 'IMAGE' ? images : files}
        keyExtractor={(item) => String(item.id)}
        numColumns={tab === 'IMAGE' ? 3 : 1}
        key={tab} // ép remount khi đổi số cột
        ListHeaderComponent={
          <View>
            {/* Thành viên */}
            <View className="px-4 pt-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="large">
                  Thành viên{isGroup ? ` (${members.length})` : ''}
                </Text>
                {isGroup && (
                  <Button variant="ghost" className="h-auto p-1" onPress={() => setAddOpen(true)}>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="person-add-outline" size={18} color={colors.foreground} />
                      <Text className="text-sm text-primary">Thêm</Text>
                    </View>
                  </Button>
                )}
              </View>
              {members.map((m) => {
                const avatarUri = resolveMediaUrl(m.avatarUrl);
                return (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Xem hồ sơ của ${m.username}`}
                    className="flex-row items-center gap-3 py-2 active:opacity-70"
                    onPress={() => openProfile(m.id)}>
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="size-10 items-center justify-center rounded-full bg-muted">
                        <Text className="font-bold uppercase text-muted-foreground">
                          {m.username?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text className="flex-1" numberOfLines={1}>
                      {m.username}
                      {m.id === userId ? ' (Bạn)' : ''}
                    </Text>
                  </Pressable>
                );
              })}

            </View>

            {/* Tabs media */}
            <View className="mt-4 flex-row border-b border-border px-4">
              <Pressable
                className={`mr-4 border-b-2 pb-2 ${tab === 'IMAGE' ? 'border-primary' : 'border-transparent'}`}
                onPress={() => setTab('IMAGE')}>
                <Text className={tab === 'IMAGE' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                  Ảnh ({images.length})
                </Text>
              </Pressable>
              <Pressable
                className={`border-b-2 pb-2 ${tab === 'FILE' ? 'border-primary' : 'border-transparent'}`}
                onPress={() => setTab('FILE')}>
                <Text className={tab === 'FILE' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                  Tệp ({files.length})
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const uri = resolveMediaUrl(item.content);
          if (tab === 'IMAGE') {
            return (
              <Pressable
                className="p-0.5"
                style={{ width: '33.33%', aspectRatio: 1 }}
                onPress={() => uri && Linking.openURL(uri)}>
                {uri && (
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%', borderRadius: 6 }}
                    contentFit="cover"
                  />
                )}
              </Pressable>
            );
          }
          const fileName = item.content.split('/').pop() ?? 'Tệp';
          return (
            <Pressable
              className="mx-4 my-1 flex-row items-center gap-2 rounded-md border border-border p-3 active:bg-muted"
              onPress={() => uri && Linking.openURL(uri)}>
              <Ionicons name="document-outline" size={20} color={colors.foreground} />
              <Text numberOfLines={1} className="flex-1">
                {fileName}
              </Text>
              <Ionicons name="download-outline" size={18} color={colors.mutedForeground} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center px-6 py-10">
            <Text variant="muted" className="text-center">
              {tab === 'IMAGE' ? 'Chưa có ảnh nào được chia sẻ.' : 'Chưa có tệp nào được chia sẻ.'}
            </Text>
          </View>
        }
        contentContainerClassName="pb-6"
      />

      {isGroup && (
        <AddMemberModal
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          conversationId={conversationId}
          currentMemberIds={members.map((m) => m.id)}
          userId={userId}
          onAdded={loadDetail}
        />
      )}
    </SafeAreaView>
  );
}

// Modal chọn bạn bè để thêm vào nhóm chat.
function AddMemberModal({
  visible,
  onClose,
  conversationId,
  currentMemberIds,
  userId,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  conversationId: number;
  currentMemberIds: number[];
  userId: number | null | undefined;
  onAdded: () => void;
}) {
  const colors = useThemeColors();
  const [friends, setFriends] = useState<IFriendship[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;
    setSelected(new Set());
    setLoading(true);
    friendService
      .getSingle<CursorPageResponse<IFriendship>>(API.FRIEND.BASE, undefined, {
        userId,
        size: 100,
      })
      .then((res) => {
        const memberSet = new Set(currentMemberIds);
        const available = (res?.data ?? []).filter((f) => !memberSet.has(f.user.id));
        setFriends(available);
      })
      .catch((e) => console.error('Lỗi khi tải bạn bè:', e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, userId]);

  const toggle = (fid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(fid) ? next.delete(fid) : next.add(fid);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size < 1 || !userId) return;
    setSubmitting(true);
    try {
      await chatService.addMembersToGroup(conversationId, Array.from(selected), userId);
      onAdded();
      onClose();
    } catch (e) {
      console.error('Lỗi khi thêm thành viên:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[70%] rounded-t-2xl bg-background p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="large">Thêm thành viên</Text>
            <Button variant="ghost" className="h-auto p-1" onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Button>
          </View>

          {loading ? (
            <View className="py-10">
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => String(item.user.id)}
              renderItem={({ item }) => {
                const avatarUri = resolveMediaUrl(item.user.avatar);
                const isSel = selected.has(item.user.id);
                return (
                  <Pressable
                    className={`flex-row items-center gap-3 rounded-md p-2 ${isSel ? 'bg-muted' : ''}`}
                    onPress={() => toggle(item.user.id)}>
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="size-9 items-center justify-center rounded-full bg-muted">
                        <Text className="font-bold uppercase text-muted-foreground">
                          {item.user.name?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text className="flex-1" numberOfLines={1}>
                      {item.user.nickName || item.user.name}
                    </Text>
                    <Ionicons
                      name={isSel ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSel ? colors.foreground : colors.mutedForeground}
                    />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View className="py-10 items-center">
                  <Text variant="muted">Không có bạn bè nào để thêm.</Text>
                </View>
              }
            />
          )}

          <Button
            className="mt-3 rounded-full"
            disabled={selected.size < 1 || submitting}
            onPress={handleAdd}>
            <Text>{submitting ? 'Đang thêm...' : `Thêm (${selected.size})`}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
