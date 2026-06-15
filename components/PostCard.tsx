// PostCard — thẻ bài viết trên feed. Port ý tưởng từ web (src/components/PostCard.tsx).
import { memo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SentimentIndicator } from '@/components/SentimentIndicator';
import { resolveMediaUrl } from '@/lib/media';
import { timeAgo } from '@/lib/time';
import type { IPost } from '@/types';


interface PostCardProps {
  post: IPost;
  onToggleLike?: (post: IPost) => void;
  onComment?: (post: IPost) => void;
  likeDisabled?: boolean;
}

function PostCardBase({ post, onToggleLike, onComment, likeDisabled }: PostCardProps) {
  const avatarUri = resolveMediaUrl(post.author.avatar);
  const displayName = post.author.nickName || post.author.name;

  return (
    <View className="bg-card px-4 py-3">
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-3">
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
        ) : (
          <View className="size-10 items-center justify-center rounded-full bg-muted">
            <Text className="font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {displayName}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text variant="muted" className="text-xs">
              {timeAgo(post.createdAt)}
            </Text>
            <SentimentIndicator
              data={{
                sentiment: post.sentiment,
                confidence: post.confidence,
                cancelReason: post.cancelReason,
              }}
            />
          </View>
        </View>
      </View>


      {/* Content */}
      {!!post.content && <Text className="mb-3 leading-6">{post.content}</Text>}

      {/* Counters */}
      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="muted" className="text-xs">
          {post.likeCount} lượt thích
        </Text>
        <Text variant="muted" className="text-xs">
          {post.commentCount} bình luận
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row border-t border-border pt-1">
        <Button
          variant="ghost"
          className="flex-1"
          disabled={likeDisabled}
          onPress={() => onToggleLike?.(post)}>
          <Ionicons
            name={post.hasLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.hasLiked ? 'hsl(0, 84.2%, 60.2%)' : 'hsl(240, 3.8%, 46.1%)'}
          />
          <Text className={post.hasLiked ? 'text-destructive' : 'text-muted-foreground'}>
            Thích
          </Text>
        </Button>
        <Button variant="ghost" className="flex-1" onPress={() => onComment?.(post)}>
          <Ionicons name="chatbubble-outline" size={20} color="hsl(240, 3.8%, 46.1%)" />
          <Text className="text-muted-foreground">Bình luận</Text>
        </Button>
      </View>
    </View>
  );
}

export const PostCard = memo(PostCardBase);
