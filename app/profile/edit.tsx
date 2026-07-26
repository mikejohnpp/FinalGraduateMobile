// Màn hình chỉnh sửa hồ sơ — port ý tưởng từ web (ProfileEditPanel).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useAppSelector } from '@/store/hooks';
import type { IProfileUpdate } from '@/types';
import { useThemeColors } from '@/hooks/useTheme';

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const profile = useAppSelector((r) => r.user.profile);
  const { update, loading } = useUpdateProfile();
  const router = useRouter();

  const [form, setForm] = useState<IProfileUpdate>({
    nickName: profile?.nickName ?? '',
    bio: profile?.bio ?? '',
    location: profile?.location ?? '',
    workplace: profile?.workplace ?? '',
    education: profile?.education ?? '',
    hometown: profile?.hometown ?? '',
    relationship: profile?.relationship ?? '',
  });

  const setField = (key: keyof IProfileUpdate, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const result = await update(form);
    if (result) router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large">Chỉnh sửa hồ sơ</Text>
        <Button variant="ghost" className="h-auto p-0" disabled={loading} onPress={handleSave}>
          <Text className="text-primary">{loading ? 'Đang lưu...' : 'Lưu'}</Text>
        </Button>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
          <Field label="Biệt danh" value={form.nickName} onChange={(v) => setField('nickName', v)} />
          <Field
            label="Tiểu sử"
            value={form.bio}
            onChange={(v) => setField('bio', v)}
            multiline
          />
          <Field label="Nơi sống" value={form.location} onChange={(v) => setField('location', v)} />
          <Field label="Nơi làm việc" value={form.workplace} onChange={(v) => setField('workplace', v)} />
          <Field label="Học vấn" value={form.education} onChange={(v) => setField('education', v)} />
          <Field label="Quê quán" value={form.hometown} onChange={(v) => setField('hometown', v)} />
          <Field
            label="Mối quan hệ"
            value={form.relationship}
            onChange={(v) => setField('relationship', v)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const colors = useThemeColors();
  return (

    <View className="gap-2">
      <Text variant="small">{label}</Text>
      <TextInput
        className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground"
        style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : undefined}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}
