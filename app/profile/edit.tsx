// Màn hình chỉnh sửa hồ sơ — port từ web (ProfileEditPanel + EditableRow).
// Giữ đúng luồng của web: mỗi trường sửa inline, khi một trường đang mở thì các
// trường khác bị khoá, và chỉ gọi API một lần khi bấm "Xác nhận & Lưu thay đổi".
// Khác web: panel nổi → màn hình riêng (expo-router), Textarea → TextInput multiline.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EditableRow } from '@/components/EditableRow';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useThemeColors } from '@/hooks/useTheme';
import type { IProfileUpdate, UserProfileDTO } from '@/types';

// Giới hạn ký tự của phần giới thiệu — giống web (maxLength 101).
const BIO_MAX_LENGTH = 101;

// Đổ profile vào draft — các trường null trở thành chuỗi rỗng như web.
function toDraft(profile: UserProfileDTO | null | undefined): IProfileUpdate {
  return {
    userName: profile?.userName ?? '',
    nickName: profile?.nickName ?? '',
    bio: profile?.bio ?? '',
    location: profile?.location ?? '',
    education: profile?.education ?? '',
    workplace: profile?.workplace ?? '',
    hometown: profile?.hometown ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    relationship: profile?.relationship ?? '',
    gender: profile?.gender ?? '',
    pronouns: profile?.pronouns ?? '',
    language: profile?.language ?? '',
  };
}


export default function EditProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { profile } = useCurrentProfile();
  const { update, loading } = useUpdateProfile();

  // Trường đang được mở để sửa; null = không có trường nào.
  const [activeField, setActiveField] = useState<string | null>(null);
  const [draft, setDraft] = useState<IProfileUpdate>(() => toDraft(profile));

  // Web luôn có profile khi mở panel; mobile mở màn hình riêng nên profile có thể
  // về sau (fetch async). Nạp draft đúng một lần khi profile đầu tiên xuất hiện.
  const [hydratedId, setHydratedId] = useState<number | null>(profile?.id ?? null);
  if (profile && profile.id !== hydratedId) {
    setHydratedId(profile.id);
    setDraft(toDraft(profile));
  }


  const handleEdit = (field: string) => {
    if (activeField !== null) return;
    setActiveField(field);
  };

  const handleCancel = () => setActiveField(null);

  // Lưu vào draft (chưa gọi API) rồi đóng trường đang sửa — giống web.
  const handleSaveField = (field: string, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setActiveField(null);
  };

  const handleFinalSave = async () => {
    const result = await update(draft);
    if (result) router.back();
  };

  // Helper để bớt lặp props cho từng hàng.
  const rowProps = (field: keyof IProfileUpdate) => ({
    field,
    value: draft[field] as string | undefined,
    isActive: activeField === field,
    isLocked: activeField !== null && activeField !== field,
    onEdit: handleEdit,
    onSave: handleSaveField,
    onCancel: handleCancel,
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-2 border-b border-border px-2 py-3">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Button>
        <Text variant="large" className="flex-1">
          Chỉnh sửa trang cá nhân
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="p-4 pb-8" keyboardShouldPersistTaps="handled">
          {/* Nhóm: Tên hiển thị */}
          <SectionTitle>Tên hiển thị</SectionTitle>
          <View className="mb-5 gap-1">
            <EditableRow
              icon="person-outline"
              label="Tên hiển thị"
              placeholder="Thêm tên hiển thị"
              {...rowProps('userName')}
            />
            <EditableRow
              icon="at-outline"
              label="Biệt danh"
              placeholder="Thêm biệt danh"
              {...rowProps('nickName')}
            />
          </View>

          {/* Nhóm: Giới thiệu (bio dùng ô nhiều dòng + đếm ký tự) */}
          <SectionTitle>Giới thiệu</SectionTitle>
          <View className="mb-5">
            {activeField === 'bio' ? (
              <View className="gap-2 rounded-md border border-border bg-muted/30 p-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="hand-left-outline" size={18} color={colors.mutedForeground} />
                  <Text variant="small" className="text-muted-foreground">
                    Giới thiệu về bạn
                  </Text>
                </View>
                <TextInput
                  className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground"
                  style={{ minHeight: 96, textAlignVertical: 'top' }}
                  value={draft.bio ?? ''}
                  onChangeText={(v) => setDraft((prev) => ({ ...prev, bio: v }))}
                  placeholder="Mô tả bản thân..."
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={BIO_MAX_LENGTH}
                  multiline
                  autoFocus
                />
                <View className="mt-1 flex-row items-center justify-between">
                  <Text variant="muted" className="text-xs">
                    {draft.bio?.length ?? 0}/{BIO_MAX_LENGTH}
                  </Text>
                  <View className="flex-row gap-2">
                    <Button size="sm" variant="secondary" onPress={handleCancel}>
                      <Text className="text-xs">Hủy</Text>
                    </Button>
                    <Button size="sm" onPress={() => setActiveField(null)}>
                      <Text className="text-xs text-primary-foreground">Lưu</Text>
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <Button
                variant="outline"
                className="h-auto flex-col items-stretch gap-2 rounded-md p-3"
                disabled={activeField !== null}
                accessibilityLabel="Chỉnh sửa giới thiệu về bạn"
                onPress={() => handleEdit('bio')}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold">Giới thiệu về bạn</Text>
                  <View className="rounded-full bg-secondary px-2 py-0.5">
                    <Text className="text-xs text-secondary-foreground">Công khai</Text>
                  </View>
                </View>
                <Text className="py-3 text-center text-sm">
                  {draft.bio || 'Chưa có thông tin giới thiệu'}
                </Text>
              </Button>
            )}
          </View>

          {/* Nhóm: Thông tin cá nhân */}
          <SectionTitle>Thông tin cá nhân</SectionTitle>
          <View className="gap-1">
            <EditableRow
              icon="location-outline"
              label="Vị trí hiện tại"
              placeholder="Thêm vị trí"
              {...rowProps('location')}
            />
            <EditableRow
              icon="home-outline"
              label="Quê quán"
              placeholder="Thêm quê quán"
              {...rowProps('hometown')}
            />
            <EditableRow
              icon="gift-outline"
              label="Sinh nhật"
              placeholder="Thêm ngày sinh (yyyy-MM-dd)"
              {...rowProps('dateOfBirth')}
            />
            <EditableRow
              icon="heart-outline"
              label="Tình trạng mối quan hệ"
              placeholder="Thêm tình trạng"
              {...rowProps('relationship')}
            />
            <EditableRow
              icon="male-female-outline"
              label="Giới tính"
              placeholder="Thêm giới tính"
              {...rowProps('gender')}
            />
            <EditableRow
              icon="chatbubble-ellipses-outline"
              label="Danh xưng"
              placeholder="Thêm danh xưng"
              {...rowProps('pronouns')}
            />
            <EditableRow
              icon="globe-outline"
              label="Ngôn ngữ"
              placeholder="Thêm ngôn ngữ"
              {...rowProps('language')}
            />
            <EditableRow
              icon="school-outline"
              label="Học vấn"
              placeholder="Thêm trường học"
              {...rowProps('education')}
            />
            <EditableRow
              icon="briefcase-outline"
              label="Nơi làm việc"
              placeholder="Thêm nơi làm việc"
              {...rowProps('workplace')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer: chỉ lưu khi không còn trường nào đang mở — giống web */}
      <View className="border-t border-border bg-muted/20 p-4">
        <Button disabled={activeField !== null || loading} onPress={handleFinalSave}>
          <Text className="text-primary-foreground">
            {loading ? 'Đang lưu...' : 'Xác nhận & Lưu thay đổi'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View className="mb-3 border-b border-border pb-2">
      <Text className="font-semibold">{children}</Text>
    </View>
  );
}
