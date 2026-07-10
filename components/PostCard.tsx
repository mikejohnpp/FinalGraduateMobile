// PostCard — thẻ bài viết trên feed. Port ý tưởng từ web (src/components/PostCard.tsx).
import { memo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SentimentIndicator } from '@/components/SentimentIndicator';
import MediaGallery from '@/components/MediaGallery';
import { resolveMediaUrl } from '@/lib/media';

import { timeAgo } from '@/lib/time';
import type { IPost } from '@/types';


interface PostCardProps {
  post: IPost;
  onToggleLike?: (post: IPost) => Promise<boolean | void> | void;
  onComment?: (post: IPost) => void;
  likeDisabled?: boolean;
}

function PostCardBase({ post, onToggleLike, onComment, likeDisabled }: PostCardProps) {
  const [liked, setLiked] = useState(post.hasLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likeCount ?? 0);

  useEffect(() => {
    setLiked(post.hasLiked ?? false);
    setLikesCount(post.likeCount ?? 0);
  }, [post.hasLiked, post.likeCount]);

  const handleToggleLikeLocal = async () => {
    if (likeDisabled) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(prev => prev + (wasLiked ? -1 : 1));

    if (onToggleLike) {
      const success = await onToggleLike(post);
      if (success === false) {
        // Revert on failure
        setLiked(wasLiked);
        setLikesCount(prev => prev + (wasLiked ? 1 : -1));
      }
    }
  };
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

      {/* Media (ảnh/video/file) */}
      {post.media?.length > 0 && (
        <View className="mb-3">
          <MediaGallery media={post.media} size="post" />
        </View>
      )}

      {/* Counters */}

      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="muted" className="text-xs">
          {likesCount} lượt thích
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
          onPress={handleToggleLikeLocal}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? 'hsl(0, 84.2%, 60.2%)' : 'hsl(240, 3.8%, 46.1%)'}
          />
          <Text className={liked ? 'text-destructive' : 'text-muted-foreground'}>
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
