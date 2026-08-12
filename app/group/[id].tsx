import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GroupPostComposer } from '@/components/GroupPostComposer';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useGroupActions,
  useGroupDetail,
  useGroupImage,
  useGroupMembers,
  useSingleGroupPosts,
} from '@/hooks/useGroup';
import { useLikePost } from '@/hooks/usePost';
import { useOpenProfile } from '@/hooks/useOpenProfile';
import { pickImageWithMeta } from '@/lib/imagePicker';
import { resolveMediaUrl } from '@/lib/media';
import { goBackOr } from '@/lib/navigation';
import { useAppSelector } from '@/store/hooks';
import type { IGroupMember, IPost } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

const ROLE_LABEL: Record<IGroupMember['role'], string> = {
  ADMIN: 'Quản trị viên',
  MODERATOR: 'Người kiểm duyệt',
  MEMBER: 'Thành viên',
};

const ROLE_ORDER: Record<IGroupMember['role'], number> = {
  ADMIN: 0,
  MODERATOR: 1,
  MEMBER: 2,
};

const MAX_AVATAR_PREVIEW = 10;

type Tab = 'posts' | 'about' | 'members';

export default function GroupDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);
  const router = useRouter();
  const openProfile = useOpenProfile();

  const [tab, setTab] = useState<Tab>('posts');
  const { group, loading, setGroup, refetch: refetchGroup } = useGroupDetail(groupId);
  const { posts, loadMore, loading: postsLoading, prependPost } = useSingleGroupPosts(groupId);
  const { members, loading: membersLoading } = useGroupMembers(groupId);
  const { joinGroup, leaveGroup, loading: actionLoading } = useGroupActions();
  const { like, unlike, loadingId } = useLikePost();
  const { uploadAvatar, uploadCover, uploadingAvatar, uploadingCover } = useGroupImage();
  const userId = useAppSelector((r) => r.user.userId);

  const isAdmin = group?.role === 'ADMIN';
  const sortedMembers = [...members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
  const previewMembers = sortedMembers.slice(0, MAX_AVATAR_PREVIEW);
  const remainingCount = (group?.memberCount ?? 0) - previewMembers.length;
  const groupAdmin = sortedMembers.find((m) => m.role === 'ADMIN');

  const handleToggleLike = useCallback(
    (post: IPost) => {
      if (!userId) return;
      post.hasLiked ? unlike(post.id, userId) : like(post.id, userId);
    },
    [userId, like, unlike]
  );

  const handleJoin = useCallback(async () => {
    if (!group) return;
    const ok = await joinGroup(group);
    if (ok) refetchGroup();
  }, [group, joinGroup, refetchGroup]);

  const handleLeave = useCallback(async () => {
    const ok = await leaveGroup(groupId);
    if (ok) refetchGroup();
  }, [groupId, leaveGroup, refetchGroup]);

  const handleChangeCover = useCallback(async () => {
    const picked = await pickImageWithMeta([16, 9]);
    if (!picked) return;
    const updated = await uploadCover(groupId, picked.uri, picked.mimeType);
    if (updated) setGroup(updated);
  }, [groupId, uploadCover, setGroup]);

  const handleChangeAvatar = useCallback(async () => {
    const picked = await pickImageWithMeta([1, 1]);
    if (!picked) return;
    const updated = await uploadAvatar(groupId, picked.uri, picked.mimeType);
    if (updated) setGroup(updated);
  }, [groupId, uploadAvatar, setGroup]);

  if (loading && !group) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-background px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Text variant="h3">Không tìm thấy nhóm</Text>
        <Text variant="muted" className="text-center">
          Nhóm này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </Text>
        <Button variant="secondary" className="mt-2" onPress={() => goBackOr(router, '/groups')}>
          <Text>Quay lại</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const coverUri = resolveMediaUrl(group.coverPhoto);
  const avatarUri = resolveMediaUrl(group.avatar);
  const isPublic = group.privacy === 'public';

  const renderMemberRow = (item: IGroupMember) => {
    const memberAvatar = resolveMediaUrl(item.avatar);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem hồ sơ của ${item.name}`}
        className="flex-row items-center gap-3 bg-card px-4 py-3 active:bg-muted"
        onPress={() => openProfile(item.userId)}>
        {memberAvatar ? (
          <Image
            source={{ uri: memberAvatar }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
            contentFit="cover"
          />
        ) : (
          <View className="size-11 items-center justify-center rounded-full bg-muted">
            <Text className="font-bold uppercase text-muted-foreground">
              {item.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {item.name}
          </Text>
          {item.role !== 'MEMBER' && (
            <Text variant="muted" className="text-xs">
              {ROLE_LABEL[item.role]}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const header = (
    <View className="bg-card">
      <View>
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{ width: '100%', height: 160 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-40 w-full bg-muted" />
        )}

        {isAdmin && (
          <Button
            variant="secondary"
            className="absolute bottom-2 right-2 h-9 flex-row gap-1 rounded-full px-3 opacity-90"
            disabled={uploadingCover}
            onPress={handleChangeCover}>
            {uploadingCover ? (
              <ActivityIndicator size="small" />
            ) : (
              <Ionicons name="camera-outline" size={16} color={colors.foreground} />
            )}
            <Text className="text-xs">Ảnh bìa</Text>
          </Button>
        )}
      </View>
      <View className="gap-2 px-4 pb-4">
        <View className="-mt-11 self-start">
          <View className="size-[88px] overflow-hidden rounded-full border-4 border-card bg-muted">
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-muted">
                <Text className="text-3xl font-bold uppercase text-muted-foreground">
                  {group.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>

          {isAdmin && (
            <Button
              variant="secondary"
              className="absolute bottom-0 right-0 size-9 items-center justify-center rounded-full border-2 border-card p-0"
              disabled={uploadingAvatar}
              onPress={handleChangeAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="camera" size={16} color={colors.foreground} />
              )}
            </Button>
          )}
        </View>

        <Text variant="h3">{group.name}</Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name={isPublic ? 'earth' : 'lock-closed'}
            size={14}
            color={colors.mutedForeground}
          />
          <Text variant="muted" className="text-sm">
            Nhóm {isPublic ? 'Công khai' : 'Riêng tư'} · {group.memberCount} thành viên
          </Text>
        </View>

        {isAdmin ? (
          <Button variant="secondary" onPress={() => router.push(`/group/${groupId}/admin`)}>
            <Ionicons name="settings-outline" size={16} color={colors.foreground} />
            <Text>Quản trị nhóm</Text>
          </Button>
        ) : group.isJoined ? (
          <Button variant="secondary" disabled={actionLoading} onPress={handleLeave}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.foreground} />
            <Text>Đã tham gia</Text>
          </Button>
        ) : group.isPending ? (
          <Button variant="outline" disabled>
            <Text className="text-muted-foreground">Đang chờ duyệt</Text>
          </Button>
        ) : (
          <Button disabled={actionLoading} onPress={handleJoin}>
            <Text className="text-primary-foreground">Tham gia nhóm</Text>
          </Button>
        )}
      </View>

      <View className="flex-row border-t border-border">
        {(
          [
            ['posts', 'Bài viết'],
            ['about', 'Giới thiệu'],
            ['members', 'Thành viên'],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === value }}
            className={`flex-1 items-center border-b-2 py-3 ${tab === value ? 'border-primary' : 'border-transparent'}`}
            onPress={() => setTab(value)}>
            <Text
              className={tab === value ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const aboutSection = (
    <View className="gap-2 pb-4">
      <View className="gap-3 bg-card p-4">
        <Text variant="large">Giới thiệu về nhóm này</Text>
        <View className="flex-row gap-3">
          <Ionicons
            name={isPublic ? 'earth' : 'lock-closed'}
            size={22}
            color={colors.mutedForeground}
          />
          <View className="flex-1">
            <Text className="font-semibold">{isPublic ? 'Công khai' : 'Riêng tư'}</Text>
            <Text variant="muted" className="mt-0.5 text-xs">
              {isPublic
                ? 'Bất kỳ ai cũng có thể nhìn thấy mọi người trong nhóm và những gì họ đăng.'
                : 'Chỉ thành viên mới nhìn thấy mọi người trong nhóm và những gì họ đăng.'}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3 bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="large">Thành viên</Text>
          <Pressable accessibilityRole="button" onPress={() => setTab('members')}>
            <Text className="text-xs font-semibold text-primary">Xem tất cả</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="people-outline" size={18} color={colors.mutedForeground} />
          <Text className="text-sm">{group.memberCount} người</Text>
        </View>

        <View className="flex-row items-center">
          {previewMembers.map((m) => {
            const uri = resolveMediaUrl(m.avatar);
            return (
              <Pressable
                key={m.userId}
                accessibilityRole="button"
                accessibilityLabel={`Xem hồ sơ của ${m.name}`}
                className="-mr-1.5 active:opacity-70"
                onPress={() => openProfile(m.userId)}>
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: colors.card,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="size-8 items-center justify-center rounded-full border-2 border-card bg-muted">
                    <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                      {m.name?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {remainingCount > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xem thêm ${remainingCount} thành viên`}
              className="size-8 items-center justify-center rounded-full border-2 border-card bg-muted"
              onPress={() => setTab('members')}>
              <Text className="text-[10px] font-semibold text-muted-foreground">
                +{remainingCount}
              </Text>
            </Pressable>
          )}
        </View>

        {groupAdmin && (
          <View className="border-t border-border pt-3">{renderMemberRow(groupAdmin)}</View>
        )}
      </View>
    </View>
  );

  const emptyPosts = !postsLoading ? (
    <View className="items-center bg-card py-8">
      <Text variant="muted" className="px-6 text-center">
        {group.privacy === 'private' && !group.isJoined
          ? 'Đây là nhóm kín. Bạn cần tham gia để xem bài viết.'
          : 'Chưa có bài viết nào trong nhóm.'}
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 bg-card px-4 py-2">
        <Button
          variant="ghost"
          className="h-auto p-1"
          accessibilityLabel="Quay lại"
          onPress={() => goBackOr(router, '/groups')}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large" numberOfLines={1}>
          {group.name ?? 'Nhóm'}
        </Text>
      </View>

      {tab === 'members' ? (
        <FlatList
          data={sortedMembers}
          keyExtractor={(item) => String(item.userId)}
          ListHeaderComponent={header}
          renderItem={({ item }) => renderMemberRow(item)}
          ItemSeparatorComponent={() => <View className="h-px bg-border" />}
          ListEmptyComponent={
            !membersLoading ? (
              <View className="items-center bg-card py-8">
                <Text variant="muted">Chưa có thành viên nào.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            membersLoading ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={tab === 'posts' ? posts : []}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View>
              {header}
              {tab === 'about'
                ? aboutSection
                : group.isJoined && (
                    <View className="mb-2 mt-2">
                      <GroupPostComposer groupId={groupId} onPostCreated={prependPost} />
                    </View>
                  )}
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleLike={handleToggleLike}
              onComment={(p) => router.push(`/post/${p.id}`)}
              likeDisabled={loadingId === item.id}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          onEndReached={tab === 'posts' ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={tab === 'posts' ? emptyPosts : null}
          ListFooterComponent={
            tab === 'posts' && postsLoading ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
