// Màn hình quên mật khẩu — port từ web (src/views/auth/ForgotPassword.tsx).
// Flow 3 bước: nhập email → nhập OTP → đặt lại mật khẩu.
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useForgotPassword } from '@/hooks/useUser';
import { useThemeColors } from '@/hooks/useTheme';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const colors = useThemeColors();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { sendOtp, verifyOtp, resetPassword, loading, error } = useForgotPassword();
  const router = useRouter();

  const handleSendOtp = async () => {
    const ok = await sendOtp(email);
    if (ok) setStep('otp');
  };

  const handleVerifyOtp = async () => {
    const ok = await verifyOtp(email, otp);
    if (ok) setStep('reset');
  };

  const handleResetPassword = async () => {
    const ok = await resetPassword(email, otp, newPassword, confirmPassword);
    if (ok) router.replace('/login');
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
              Quên mật khẩu
            </Text>
            <Text variant="muted">
              {step === 'email' && 'Nhập email của bạn.'}
              {step === 'otp' && 'Nhập mã xác nhận.'}
              {step === 'reset' && 'Đặt lại mật khẩu.'}
            </Text>
          </View>

          {/* Bước 1: Nhập email */}
          {step === 'email' && (
            <View className="gap-4">
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
                  autoFocus
                  onSubmitEditing={handleSendOtp}
                />
                <Text variant="muted" className="text-xs">
                  Chúng tôi sẽ gửi mã xác nhận (OTP) đến email này.
                </Text>
              </View>

              {error && <Text className="text-sm text-destructive">{error}</Text>}

              <Button className="mt-2 rounded-full" onPress={handleSendOtp} disabled={loading}>
                {loading && <ActivityIndicator size="small" color="white" />}
                <Text>Gửi mã xác nhận</Text>
              </Button>
            </View>
          )}

          {/* Bước 2: Nhập OTP */}
          {step === 'otp' && (
            <View className="gap-4">
              <View className="gap-2">
                <Text variant="small">Mã OTP</Text>
                <TextInput
                  className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                  placeholder="Nhập mã 6 chữ số"
                  placeholderTextColor={colors.mutedForeground}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  onSubmitEditing={handleVerifyOtp}
                />
                <Text variant="muted" className="text-xs">
                  Mã đã được gửi tới {email}.
                </Text>
              </View>

              {error && <Text className="text-sm text-destructive">{error}</Text>}

              <Button className="mt-2 rounded-full" onPress={handleVerifyOtp} disabled={loading}>
                {loading && <ActivityIndicator size="small" color="white" />}
                <Text>Xác nhận</Text>
              </Button>

              <Button
                variant="link"
                className="h-auto p-0"
                onPress={handleSendOtp}
                disabled={loading}>
                <Text className="text-primary">Gửi lại mã</Text>
              </Button>
            </View>
          )}

          {/* Bước 3: Đặt lại mật khẩu */}
          {step === 'reset' && (
            <View className="gap-4">
              <View className="gap-2">
                <Text variant="small">Mật khẩu mới</Text>
                <TextInput
                  className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoFocus
                />
              </View>

              <View className="gap-2">
                <Text variant="small">Xác nhận mật khẩu</Text>
                <TextInput
                  className="h-12 rounded-md border border-input bg-background px-3 text-foreground"
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  onSubmitEditing={handleResetPassword}
                />
                <Text variant="muted" className="text-xs">
                  Mật khẩu tối thiểu 6 ký tự.
                </Text>
              </View>

              {error && <Text className="text-sm text-destructive">{error}</Text>}

              <Button className="mt-2 rounded-full" onPress={handleResetPassword} disabled={loading}>
                {loading && <ActivityIndicator size="small" color="white" />}
                <Text>Đặt lại mật khẩu</Text>
              </Button>
            </View>
          )}

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text variant="muted">Nhớ mật khẩu?</Text>
            <Button variant="link" className="h-auto p-0" onPress={() => router.replace('/login')}>
              <Text className="text-primary">Đăng nhập</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
