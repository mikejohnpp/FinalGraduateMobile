// GroupPills — thanh pill ngang chọn tab trong khu vực Nhóm.
// Chỉ đổi page của pager (không điều hướng màn hình) để giữ trạng thái cuộn/dữ liệu của từng tab.
import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';

export const GROUP_TAB_LABELS = ['Dành cho bạn', 'Nhóm của bạn', 'Khám phá'] as const;

interface GroupPillsProps {
  /** Chỉ số tab đang mở (0..2). */
  active: number;
  onChange: (index: number) => void;
}

export function GroupPills({ active, onChange }: GroupPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-card"
      contentContainerClassName="gap-2 px-4 py-2">
      {GROUP_TAB_LABELS.map((label, index) => {
        const selected = index === active;
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            className={`rounded-full px-4 py-2 active:opacity-70 ${
              selected ? 'bg-primary/15' : 'bg-muted'
            }`}
            onPress={() => onChange(index)}>
            <Text
              className={`text-sm ${selected ? 'font-semibold text-primary' : 'text-foreground'}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
