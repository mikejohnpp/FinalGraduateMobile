// ProfileAboutCard — khối "Giới thiệu", port từ web (ProfileAbout.tsx).
// Giữ nguyên các dòng thông tin và cách diễn đạt của web: "Làm việc tại", "Học vị",
// "Sống tại", tình trạng quan hệ và số người theo dõi (= friendCount).
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import type { UserProfileDTO } from '@/types';

export function ProfileAboutCard({ profile }: { profile: UserProfileDTO }) {
  return (
    <View className="gap-4 bg-card px-4 py-4">
      <Text variant="large">Giới thiệu</Text>

      {!!profile.bio && <Text className="text-center text-sm">{profile.bio}</Text>}

      <View className="gap-3">
        {!!profile.workplace && (
          <InfoRow icon="briefcase-outline" prefix="Làm việc tại" value={profile.workplace} />
        )}
        {!!profile.education && (
          <InfoRow icon="school-outline" prefix="Học vị" value={profile.education} />
        )}
        {!!profile.location && (
          <InfoRow icon="location-outline" prefix="Sống tại" value={profile.location} />
        )}
        {!!profile.hometown && (
          <InfoRow icon="home-outline" prefix="Đến từ" value={profile.hometown} />
        )}
        {!!profile.relationship && (
          <InfoRow icon="heart-outline" value={profile.relationship} />
        )}
        {!!profile.dateOfBirth && (
          <InfoRow icon="gift-outline" prefix="Sinh ngày" value={profile.dateOfBirth} />
        )}
        {!!profile.language && (
          <InfoRow icon="globe-outline" prefix="Ngôn ngữ" value={profile.language} />
        )}
        <InfoRow icon="radio-outline" value={`Có ${profile.friendCount} người theo dõi`} />
      </View>
    </View>
  );
}

// Một dòng thông tin: icon + câu dẫn (tuỳ chọn) + giá trị in đậm.
function InfoRow({
  icon,
  prefix,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={20} color={colors.mutedForeground} />
      <Text className="flex-1 text-sm">
        {prefix ? `${prefix} ` : ''}
        {prefix ? <Text className="text-sm font-semibold">{value}</Text> : value}
      </Text>
    </View>
  );
}
