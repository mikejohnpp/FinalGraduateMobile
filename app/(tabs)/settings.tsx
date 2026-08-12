import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useLogoutUser, useUserProfile } from '@/hooks/useUser';
import { useTheme, useThemeColors, type ThemePreference } from '@/hooks/useTheme';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'light', label: 'Sáng', icon: 'sunny-outline' },
  { value: 'dark', label: 'Tối', icon: 'moon-outline' },
  { value: 'system', label: 'Hệ thống', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const { logout, isLoading } = useLogoutUser();
  const { profile } = useUserProfile();
  const { preference, setPreference } = useTheme();
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-6 p-6">
        <View className="gap-2">
          <Text variant="h2" className="border-b-0">
            Cài đặt
          </Text>
          <Text variant="muted">Tài khoản và tuỳ chọn ứng dụng</Text>
        </View>

        {profile && (
          <View className="rounded-lg border border-border bg-card p-4">
            <Text variant="large">{profile.nickName || profile.userName}</Text>
            {!!profile.email && <Text variant="muted">{profile.email}</Text>}
          </View>
        )}

        <View className="gap-2">
          <Text variant="large">Giao diện</Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  className={`flex-1 items-center gap-1 rounded-lg border p-3 active:opacity-70 ${active ? 'bg-accent' : ''}`}
                  style={{
                    borderColor: active ? colors.primary : colors.border,
                  }}>
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={active ? colors.primary : colors.mutedForeground}
                  />
                  <Text className={active ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-4">
          <Button variant="destructive" disabled={isLoading} onPress={logout}>
            <Text>{isLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
