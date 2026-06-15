// Màn hình đăng nhập — port từ web (src/views/auth/Login.tsx).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useLoginUser } from '@/hooks/useUser';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useLoginUser();
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    await login(email.trim(), password);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled">
          {/* Brand */}
          <View className="mb-10 items-center gap-4">
            <View className="size-24 items-center justify-center rounded-full bg-primary">
              <Text className="text-5xl font-bold text-primary-foreground">f</Text>
            </View>
            <Text variant="muted" className="text-center">
              Kết nối cộng đồng, chia sẻ khoảnh khắc.
            </Text>
          </View>

          <View className="mb-8 gap-1">
            <Text variant="h2" className="border-b-0">
              Chào mừng trở lại
            </Text>
            <Text variant="muted">Đăng nhập để tiếp tục</Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text variant="small">Email</Text>
              <TextInput
                className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                placeholder="you@example.com"
                placeholderTextColor="hsl(240, 3.8%, 46.1%)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            <View className="gap-2">
              <Text variant="small">Mật khẩu</Text>
              <TextInput
                className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                placeholder="Nhập mật khẩu"
                placeholderTextColor="hsl(240, 3.8%, 46.1%)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onSubmitEditing={handleLogin}
              />
            </View>

            {error && <Text className="text-sm text-destructive">{error}</Text>}

            <Button className="mt-2 rounded-full" onPress={handleLogin} disabled={isLoading}>
              <Text>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
            </Button>

            <View className="mt-4 flex-row items-center justify-center gap-1">
              <Text variant="muted">Chưa có tài khoản?</Text>
              <Button variant="link" className="h-auto p-0" onPress={() => router.push('/register')}>
                <Text className="text-primary">Đăng ký</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
