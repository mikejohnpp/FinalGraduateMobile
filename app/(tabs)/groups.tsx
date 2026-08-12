import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GroupPills } from '@/components/GroupPills';
import { DiscoverTab } from '@/components/groups/DiscoverTab';
import { ForYouTab } from '@/components/groups/ForYouTab';
import { MyGroupsTab } from '@/components/groups/MyGroupsTab';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';

const TAB_FOR_YOU = 0;
const TAB_MINE = 1;
const TAB_DISCOVER = 2;

export default function GroupsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(TAB_FOR_YOU);

  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
      <View className="flex-row items-center justify-between bg-card px-4 py-2">
        <Text variant="large">Nhóm</Text>
        <View className="flex-row items-center">
          <Button
            variant="ghost"
            className="h-auto p-2"
            accessibilityLabel="Tạo nhóm mới"
            onPress={() => router.push('/group/create')}>
            <Ionicons name="add-circle-outline" size={24} color={colors.foreground} />
          </Button>
          <Button
            variant="ghost"
            className="h-auto p-2"
            accessibilityLabel="Tìm kiếm nhóm"
            onPress={() => goToPage(TAB_DISCOVER)}>
            <Ionicons name="search" size={22} color={colors.foreground} />
          </Button>
        </View>
      </View>

      <View className="border-b border-border bg-card">
        <GroupPills active={page} onChange={goToPage} />
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={TAB_FOR_YOU}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}>
        <View key="for-you" className="flex-1">
          <ForYouTab
            onGoToMine={() => goToPage(TAB_MINE)}
            onGoToDiscover={() => goToPage(TAB_DISCOVER)}
          />
        </View>
        <View key="mine" className="flex-1">
          <MyGroupsTab />
        </View>
        <View key="discover" className="flex-1">
          <DiscoverTab />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}
