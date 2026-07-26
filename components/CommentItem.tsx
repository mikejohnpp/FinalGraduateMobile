// CommentItem — một bình luận + phần replies (lazy load). Port ý tưởng từ web (CommentItem).
import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SentimentIndicator } from '@/components/SentimentIndicator';
import MediaGallery from '@/components/MediaGallery';
import { useLikeComment, useReplies } from '@/hooks/useComment';
import { useThemeColors } from '@/hooks/useTheme';

import { resolveMediaUrl } from '@/lib/media';
import { timeAgo } from '@/lib/time';
import type { IComment } from '@/types';

interface CommentItemProps {
  comment: IComment;
  postId: number;
  onReply?: (comment: IComment) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, postId, onReply, isReply = false }: CommentItemProps) {
  const colors = useThemeColors();
  const avatarUri = resolveMediaUrl(comment.author.avatar);
  const displayName = comment.author.nickName || comment.author.name;

  const { like, unlike, loadingId } = useLikeComment(postId);
  const [showReplies, setShowReplies] = useState(false);
  const { replies, loaded, load, loadMore, hasMore } = useReplies(postId, comment.id);

  const toggleLike = () => {
    comment.liked ? unlike(comment.id, comment.parentId) : like(comment.id, comment.parentId);
  };

  const toggleReplies = () => {
    if (!showReplies && !loaded) load();
    setShowReplies((v) => !v);
  };

  const avatarSize = isReply ? 28 : 36;

  return (
    <View className={isReply ? 'flex-row gap-2 pl-10' : 'flex-row gap-2'}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          contentFit="cover"
        />
      ) : (
        <View
          className="items-center justify-center rounded-full bg-muted"
          style={{ width: avatarSize, height: avatarSize }}>
          <Text className="text-xs font-semibold text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1">
        {/* Bubble */}
        {(!!comment.content || comment.media?.length > 0) && (
          <View className="self-start rounded-2xl bg-muted px-3 py-2">
            <Text className="text-sm font-semibold">{displayName}</Text>
            {!!comment.content && <Text className="text-sm">{comment.content}</Text>}
          </View>
        )}

        {/* Media của comment */}
        {comment.media?.length > 0 && (
          <View className="mt-1">
            <MediaGallery media={comment.media} size="comment" />
          </View>
        )}


        {/* Meta row — thời gian, sentiment, nút thích/phản hồi (inline như web) */}
        <View className="mt-1 flex-row flex-wrap items-center gap-3 pl-1">
          <Text variant="muted" className="text-xs">
            {timeAgo(comment.createdAt)}
          </Text>
          <SentimentIndicator
            data={{
              sentiment: comment.sentiment,
              confidence: comment.confidence,
              cancelReason: comment.cancelReason,
            }}
          />
          <Button
            variant="link"
            className="h-auto p-0"
            disabled={loadingId === comment.id}
            onPress={toggleLike}>
            <Text
              className={
                comment.liked ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
              }>
              Thích{comment.likeCount > 0 ? ` (${comment.likeCount})` : ''}
            </Text>
          </Button>
          {!isReply && (
            <Button variant="link" className="h-auto p-0" onPress={() => onReply?.(comment)}>
              <Text className="text-xs text-muted-foreground">Phản hồi</Text>
            </Button>
          )}
        </View>

        {/* Replies toggle */}
        {!isReply && comment.replyCount > 0 && (
          <Button variant="link" className="h-auto justify-start p-0 pl-1" onPress={toggleReplies}>
            <Ionicons name="return-down-forward-outline" size={14} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">
              {showReplies ? 'Ẩn phản hồi' : `Xem ${comment.replyCount} phản hồi`}
            </Text>
          </Button>
        )}

        {/* Replies list */}
        {showReplies && (
          <View className="mt-2 gap-3">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} postId={postId} isReply />
            ))}
            {hasMore && replies.length > 0 && (
              <Button variant="link" className="h-auto justify-start p-0" onPress={loadMore}>
                <Text className="text-xs text-muted-foreground">Xem thêm phản hồi</Text>
              </Button>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
