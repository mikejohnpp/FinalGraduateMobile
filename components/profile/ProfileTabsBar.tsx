import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';

export type ProfileTab = 'posts' | 'about' | 'friends' | 'reels';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'posts', label: 'Bài viết' },
  { key: 'about', label: 'Giới thiệu' },
  { key: 'friends', label: 'Bạn bè' },
  { key: 'reels', label: 'Reels' },
];

interface ProfileTabsBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function ProfileTabsBar({ activeTab, onTabChange }: ProfileTabsBarProps) {
  const colors = useThemeColors();

  return (
    <View className="border-t border-border bg-card">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              onPress={() => onTabChange(tab.key)}
              className="min-w-[92px] flex-1 items-center border-b-2 px-4 py-3 active:opacity-70"
              style={{ borderBottomColor: active ? colors.primary : 'transparent' }}>
              <Text
                className={
                  active ? 'font-semibold text-primary' : 'font-semibold text-muted-foreground'
                }>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
