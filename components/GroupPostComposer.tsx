// GroupPostComposer — ô tạo bài viết trong nhóm.
// Port từ web (components/home/CreatePostCard.tsx dùng với prop groupId):
// gửi kèm { groupId, isGroupPosted: true }; nếu BE trả status PENDING thì bài chờ duyệt
// (không prepend vào danh sách), ngược lại prepend ngay như web.
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import MediaDraftPicker from '@/components/MediaDraftPicker';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useCreatePost } from '@/hooks/usePost';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';
import { countWords, limitWords } from '@/lib/text';
import { useAppSelector } from '@/store/hooks';
import type { IPost } from '@/types';

const MAX_POST_WORDS = 40;

interface GroupPostComposerProps {
  groupId: number;
  onPostCreated?: (post: IPost) => void;
}

export function GroupPostComposer({ groupId, onPostCreated }: GroupPostComposerProps) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const { create, loading, error } = useCreatePost();
  const { drafts, uploading, hasMedia, pickAndAdd, removeDraft, clear, upload } = useMediaUpload();
  const userId = useAppSelector((r) => r.user.userId);
  const profile = useAppSelector((r) => r.user.profile);

  const busy = loading || uploading;
  const canSubmit = (content.trim().length > 0 || hasMedia) && !busy;
  const wordCount = countWords(content);
  const displayName = profile?.userName || profile?.nickName || 'Bạn';
  const avatarUri = resolveMediaUrl(profile?.avatar);

  const handleClose = () => {
    if (busy) return;
    setOpen(false);
    setContent('');
    clear();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !userId) return;

    // Upload media lên storage trước, lấy URL rồi đính vào body (giống web).
    const media = await upload();
    if (media === null) return;

    const result = await create({
      userId,
      content,
      groupId,
      isGroupPosted: true,
      ...(media.length > 0 ? { media } : {}),
    });

    if (!result) return;

    if (result.status === 'PENDING') {
      Alert.alert('Đã gửi', 'Bài viết của bạn đã được gửi và đang chờ phê duyệt');
    } else {
      Alert.alert('Thành công', 'Bài viết đã được đăng thành công');
      onPostCreated?.({ ...result, commentCount: 0 } as IPost);
    }
    setContent('');
    clear();
    setOpen(false);
  };

  return (
    <View className="bg-card px-4 py-3">
      <View className="flex-row items-center gap-3">
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
        ) : (
          <View className="size-10 items-center justify-center rounded-full bg-muted">
            <Text className="font-bold uppercase text-muted-foreground">
              {displayName.charAt(0)}
            </Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tạo bài viết trong nhóm"
          className="flex-1 rounded-full bg-muted px-4 py-2.5 active:opacity-70"
          onPress={() => setOpen(true)}>
          <Text variant="muted" className="text-sm">
            Bạn viết gì đi...
          </Text>
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={handleClose}>
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Button variant="ghost" className="h-auto p-1" disabled={busy} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Button>
            <Text variant="large">Tạo bài viết</Text>
            <Button variant="ghost" className="h-auto p-1" disabled={!canSubmit} onPress={handleSubmit}>
              <Text className={canSubmit ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                {uploading ? 'Đang tải...' : loading ? 'Đang đăng...' : 'Đăng'}
              </Text>
            </Button>
          </View>

          <ScrollView contentContainerClassName="gap-3 p-4" keyboardShouldPersistTaps="handled">
            <TextInput
              className="min-h-[120px] text-base text-foreground"
              placeholder={`${displayName} ơi, bạn đang nghĩ gì thế?`}
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={(v) => setContent(limitWords(v, MAX_POST_WORDS))}
              multiline
              textAlignVertical="top"
              autoFocus
              editable={!busy}
            />

            <Text variant="muted" className="self-end text-xs">
              {wordCount}/{MAX_POST_WORDS} từ
            </Text>

            <MediaDraftPicker
              drafts={drafts}
              onPick={pickAndAdd}
              onRemove={removeDraft}
              disabled={busy}
            />

            {error && <Text className="text-sm text-destructive">{error}</Text>}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
