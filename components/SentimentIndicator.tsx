// SentimentIndicator — badge cảm xúc (sentiment) cho post/comment. Port từ web (SentimentIndicator.tsx).
// Mobile không có tooltip hover nên độ tin cậy hiển thị luôn cạnh nhãn.
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';

interface SentimentData {
  sentiment: string | null;
  confidence: number | null;
  cancelReason: string | null;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

const SENTIMENT_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string; icon: IoniconName; iconColor: string }
> = {
  positive: {
    label: 'Tích cực',
    bgClass: 'bg-green-500/10 border-green-300',
    textClass: 'text-green-600',
    icon: 'happy-outline',
    iconColor: '#16a34a',
  },
  negative: {
    label: 'Tiêu cực',
    bgClass: 'bg-red-500/10 border-red-300',
    textClass: 'text-red-600',
    icon: 'sad-outline',
    iconColor: '#dc2626',
  },
  neutral: {
    label: 'Trung lập',
    bgClass: 'bg-gray-500/10 border-gray-300',
    textClass: 'text-gray-600',
    icon: 'remove-circle-outline',
    iconColor: '#4b5563',
  },
};

export function SentimentIndicator({ data }: { data: SentimentData }) {
  const colors = useThemeColors();

  // Trường hợp không phân tích được.
  if (data.cancelReason) {
    return (
      <View className="flex-row items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
        <Ionicons name="information-circle-outline" size={12} color={colors.mutedForeground} />
        <Text variant="muted" className="text-[10px]">
          Không phân tích được
        </Text>
      </View>
    );
  }

  if (!data.sentiment) return null;

  const config = SENTIMENT_CONFIG[data.sentiment.toLowerCase()];
  if (!config) return null;

  const confPercent = data.confidence ? Math.round(data.confidence * 100) : 0;

  return (
    <View className={`flex-row items-center gap-1 rounded-full border px-2 py-0.5 ${config.bgClass}`}>
      <Ionicons name={config.icon} size={12} color={config.iconColor} />
      <Text className={`text-[10px] font-medium ${config.textClass}`}>
        {config.label}
        {confPercent > 0 ? ` · ${confPercent}%` : ''}
      </Text>
    </View>
  );
}
