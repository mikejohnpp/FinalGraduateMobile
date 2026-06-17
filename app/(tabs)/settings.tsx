// Màn hình cài đặt — hiển thị thông tin tài khoản + đăng xuất.
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useLogoutUser, useUserProfile } from '@/hooks/useUser';

export default function SettingsScreen() {
  const { logout, isLoading } = useLogoutUser();
  const { profile } = useUserProfile();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-6 p-6">
        <View className="gap-2">
          <Text variant="h2" className="border-b-0">
            Cài đặt
          </Text>
          <Text variant="muted">Tài khoản và tuỳ chọn ứng dụng</Text>
        </View>

        {/* Thông tin tài khoản */}
        {profile && (
          <View className="rounded-lg border border-border bg-card p-4">
            <Text variant="large">{profile.nickName || profile.userName}</Text>
            {!!profile.email && <Text variant="muted">{profile.email}</Text>}
          </View>
        )}

        <View className="mt-4">
          <Button variant="destructive" disabled={isLoading} onPress={logout}>
            <Text>{isLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
