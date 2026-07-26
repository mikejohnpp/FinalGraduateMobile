// Màn hình đăng ký — port từ web (src/views/auth/Register.tsx).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUserRegister } from '@/hooks/useUser';
import { useThemeColors } from '@/hooks/useTheme';

export default function RegisterScreen() {
  const colors = useThemeColors();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, error, loading } = useUserRegister();
  const router = useRouter();

  const handleRegister = async () => {
    const ok = await register({ username, email, password, confirmPassword });
    if (ok) {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled">
          <View className="mb-8 gap-1">
            <Text variant="h2" className="border-b-0">
              Tạo tài khoản
            </Text>
            <Text variant="muted">Tham gia cộng đồng ngay hôm nay</Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text variant="small">Tên người dùng</Text>
              <TextInput
                className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                placeholder="Tên hiển thị"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View className="gap-2">
              <Text variant="small">Email</Text>
              <TextInput
                className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="gap-2">
              <Text variant="small">Mật khẩu</Text>
              <TextInput
                className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                placeholder="Ít nhất 6 ký tự"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View className="gap-2">
              <Text variant="small">Xác nhận mật khẩu</Text>
              <TextInput
                className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                onSubmitEditing={handleRegister}
              />
            </View>

            {error && <Text className="text-sm text-destructive">{error}</Text>}

            <Button className="mt-2 rounded-full" onPress={handleRegister} disabled={loading}>
              <Text>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
            </Button>

            <View className="mt-4 flex-row items-center justify-center gap-1">
              <Text variant="muted">Đã có tài khoản?</Text>
              <Button variant="link" className="h-auto p-0" onPress={() => router.replace('/login')}>
                <Text className="text-primary">Đăng nhập</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
