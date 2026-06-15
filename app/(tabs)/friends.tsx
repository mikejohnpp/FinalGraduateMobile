// Màn hình Bạn bè — port ý tưởng từ web (Friends + partials).
// 3 tab con: Lời mời, Gợi ý, Bạn bè.
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendRow } from '@/components/FriendRow';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useAcceptRequest,
  useAllFriends,
  useDeclineRequest,
  useFriendRequests,
  useFriendSuggestions,
  useSendFriendRequest,
  useUnfriend,
} from '@/hooks/useFriend';

type Tab = 'requests' | 'suggestions' | 'friends';

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('requests');

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      {/* Header */}
      <View className="bg-card px-4 py-3">
        <Text variant="large">Bạn bè</Text>
      </View>

      {/* Segmented tabs */}
      <View className="flex-row border-b border-border bg-card">
        <TabButton label="Lời mời" active={tab === 'requests'} onPress={() => setTab('requests')} />
        <TabButton
          label="Gợi ý"
          active={tab === 'suggestions'}
          onPress={() => setTab('suggestions')}
        />
        <TabButton label="Bạn bè" active={tab === 'friends'} onPress={() => setTab('friends')} />
      </View>

      {tab === 'requests' && <RequestsTab />}
      {tab === 'suggestions' && <SuggestionsTab />}
      {tab === 'friends' && <FriendsTab />}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button variant="ghost" className="flex-1 rounded-none" onPress={onPress}>
      <Text className={active ? 'font-semibold text-primary' : 'text-muted-foreground'}>
        {label}
      </Text>
    </Button>
  );
}

function ListFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View className="py-4">
      <ActivityIndicator />
    </View>
  );
}

function EmptyState({ loading, text }: { loading: boolean; text: string }) {
  if (loading) return null;
  return (
    <View className="mt-20 items-center px-6">
      <Text variant="muted" className="text-center">
        {text}
      </Text>
    </View>
  );
}

function RequestsTab() {
  const { requests, loadMore, loading } = useFriendRequests();
  const { accept, loadingId: acceptingId } = useAcceptRequest();
  const { decline, loadingId: decliningId } = useDeclineRequest();

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => String(item.requestId)}
      renderItem={({ item }) => (
        <FriendRow
          user={item.sender}
          subtitle={`${item.mutualFriendCount} bạn chung`}
          primaryLabel="Chấp nhận"
          onPrimary={() => accept(item.requestId)}
          secondaryLabel="Từ chối"
          onSecondary={() => decline(item.requestId)}
          disabled={acceptingId === item.requestId || decliningId === item.requestId}
        />
      )}
      ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<EmptyState loading={loading} text="Không có lời mời kết bạn nào." />}
      ListFooterComponent={<ListFooter loading={loading} />}
    />
  );
}

function SuggestionsTab() {
  const { suggestions, loadMore, loading } = useFriendSuggestions();
  const { send, loadingId } = useSendFriendRequest();

  return (
    <FlatList
      data={suggestions}
      keyExtractor={(item) => String(item.user.id)}
      renderItem={({ item }) => (
        <FriendRow
          user={item.user}
          subtitle={`${item.mutualFriendCount} bạn chung`}
          primaryLabel="Kết bạn"
          onPrimary={() => send(item.user.id)}
          disabled={loadingId === item.user.id}
        />
      )}
      ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<EmptyState loading={loading} text="Chưa có gợi ý bạn bè." />}
      ListFooterComponent={<ListFooter loading={loading} />}
    />
  );
}

function FriendsTab() {
  const { friends, loadMore, loading } = useAllFriends();
  const { unfriend, loadingId } = useUnfriend();

  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => String(item.user.id)}
      renderItem={({ item }) => (
        <FriendRow
          user={item.user}
          subtitle={`${item.mutualFriendCount} bạn chung`}
          secondaryLabel="Huỷ kết bạn"
          onSecondary={() => unfriend(item.user.id)}
          disabled={loadingId === item.user.id}
        />
      )}
      ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<EmptyState loading={loading} text="Chưa có bạn bè nào." />}
      ListFooterComponent={<ListFooter loading={loading} />}
    />
  );
}
