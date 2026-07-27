// PostCard — thẻ bài viết trên feed. Port ý tưởng từ web (src/components/PostCard.tsx).
import { memo, useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SentimentIndicator } from '@/components/SentimentIndicator';
import MediaGallery from '@/components/MediaGallery';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';

import { timeAgo } from '@/lib/time';
import type { IPost } from '@/types';


interface PostCardProps {
  post: IPost;
  onToggleLike?: (post: IPost) => Promise<boolean | void> | void;
  onComment?: (post: IPost) => void;
  // Bấm vào tên nhóm để mở nhóm (dùng ở bảng tin nhóm) — như web.
  onPressGroup?: (groupId: number) => void;
  likeDisabled?: boolean;
}

function PostCardBase({
  post,
  onToggleLike,
  onComment,
  onPressGroup,
  likeDisabled,
}: PostCardProps) {

  const colors = useThemeColors();
  const openProfile = useOpenProfile();
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
  // Bài viết trong nhóm: hiển thị avatar nhóm (avatar tác giả lồng ở góc) + tên nhóm ở dòng đầu — như web.
  const group = post.group;
  const groupAvatarUri = resolveMediaUrl(group?.avatar);

  const handlePressGroup = () => {
    if (group) onPressGroup?.(group.id);
  };

  return (
    <View className="bg-card px-4 py-3">
      {/* Header — avatar và tên bấm được để mở hồ sơ tác giả (hoặc nhóm) */}
      <View className="mb-3 flex-row items-center gap-3">
        {group ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem nhóm ${group.name}`}
            className="active:opacity-70"
            onPress={handlePressGroup}>
            <View className="size-10 overflow-hidden rounded-full bg-muted">
              {groupAvatarUri ? (
                <Image
                  source={{ uri: groupAvatarUri }}
                  style={{ width: 40, height: 40 }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="font-semibold uppercase text-muted-foreground">
                    {group.name?.charAt(0) || 'G'}
                  </Text>
                </View>
              )}
            </View>
            {/* Avatar tác giả lồng ở góc dưới phải */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xem hồ sơ của ${displayName}`}
              className="absolute -bottom-1 -right-1"
              onPress={() => openProfile(post.author.id)}>
              <View className="size-5 overflow-hidden rounded-full border-2 border-card bg-muted">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 20, height: 20 }} contentFit="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-[8px] font-semibold text-muted-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem hồ sơ của ${displayName}`}
            className="active:opacity-70"
            onPress={() => openProfile(post.author.id)}>
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
          </Pressable>
        )}
        <View className="flex-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              group ? `Xem nhóm ${group.name}` : `Xem hồ sơ của ${displayName}`
            }
            className="self-start active:opacity-70"
            onPress={group ? handlePressGroup : () => openProfile(post.author.id)}>
            <Text className="font-semibold" numberOfLines={1}>
              {group ? group.name : displayName}
            </Text>
          </Pressable>
          <View className="flex-row flex-wrap items-center gap-1.5">
            {group && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem hồ sơ của ${displayName}`}
                  onPress={() => openProfile(post.author.id)}>
                  <Text className="text-xs font-medium">{displayName}</Text>
                </Pressable>
                {!!post.authorRole && (
                  <Text variant="muted" className="text-xs">
                    · {post.authorRole}
                  </Text>
                )}
                <Text variant="muted" className="text-xs">
                  ·
                </Text>
              </>
            )}
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

      {/* Media (ảnh/video/file) — full-bleed: bù lại px-4 của card để ảnh tràn hết chiều rộng */}
      {post.media?.length > 0 && (
        <View className="-mx-4 mb-3">
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
            color={liked ? colors.destructive : colors.mutedForeground}
          />
          <Text className={liked ? 'text-destructive' : 'text-muted-foreground'}>
            Thích
          </Text>
        </Button>
        <Button variant="ghost" className="flex-1" onPress={() => onComment?.(post)}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.mutedForeground} />
          <Text className="text-muted-foreground">Bình luận</Text>
        </Button>
      </View>
    </View>
  );
}

export const PostCard = memo(PostCardBase);
