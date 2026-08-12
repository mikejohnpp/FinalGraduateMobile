import React, { useState } from 'react';
import { View, TextInput, Alert, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupActions, useGroupImage } from '@/hooks/useGroup';
import { pickImageWithMeta } from '@/lib/imagePicker';
import { goBackOr } from '@/lib/navigation';
import { useThemeColors } from '@/hooks/useTheme';

type PickedImage = { uri: string; mimeType?: string | null };

export default function CreateGroupScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { createGroup, loading } = useGroupActions();
  const { uploadAvatar, uploadCover, uploadingAvatar, uploadingCover } = useGroupImage();

  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [avatar, setAvatar] = useState<PickedImage | null>(null);
  const [cover, setCover] = useState<PickedImage | null>(null);

  const busy = loading || uploadingAvatar || uploadingCover;

  const handlePickAvatar = async () => {
    const picked = await pickImageWithMeta([1, 1]);
    if (picked) setAvatar({ uri: picked.uri, mimeType: picked.mimeType });
  };

  const handlePickCover = async () => {
    const picked = await pickImageWithMeta([16, 9]);
    if (picked) setCover({ uri: picked.uri, mimeType: picked.mimeType });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }

    const newGroup = await createGroup({
      name: name.trim(),
      privacy,
    });

    if (newGroup) {
      if (avatar) await uploadAvatar(newGroup.id, avatar.uri, avatar.mimeType);
      if (cover) await uploadCover(newGroup.id, cover.uri, cover.mimeType);
      router.replace(`/group/${newGroup.id}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-2">
        <Button
          variant="ghost"
          className="h-auto p-1"
          accessibilityLabel="Đóng"
          onPress={() => goBackOr(router, '/groups')}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Button>
        <Text variant="large" className="font-semibold">
          Tạo nhóm
        </Text>
        <Button
          variant="ghost"
          className="h-auto px-2 py-1"
          disabled={!name.trim() || busy}
          onPress={handleCreate}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Text className={!name.trim() ? 'text-muted-foreground' : 'font-semibold text-primary'}>
              Tạo
            </Text>
          )}
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6"
        keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text variant="large" className="font-semibold">
            Ảnh nhóm
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chọn ảnh bìa nhóm"
            className="overflow-hidden rounded-lg border border-dashed border-border bg-muted active:opacity-70"
            onPress={handlePickCover}>
            {cover ? (
              <Image
                source={{ uri: cover.uri }}
                style={{ width: '100%', height: 140 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-[140px] items-center justify-center gap-1">
                <Ionicons name="image-outline" size={26} color={colors.mutedForeground} />
                <Text variant="small" className="text-muted-foreground">
                  Thêm ảnh bìa
                </Text>
              </View>
            )}
          </Pressable>

          <View className="-mt-8 flex-row items-end gap-3 px-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chọn ảnh đại diện nhóm"
              className="active:opacity-70"
              onPress={handlePickAvatar}>
              <View className="size-16 overflow-hidden rounded-full border-2 border-card bg-muted">
                {avatar ? (
                  <Image
                    source={{ uri: avatar.uri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="camera-outline" size={20} color={colors.mutedForeground} />
                  </View>
                )}
              </View>
            </Pressable>
            <Text variant="small" className="mb-1 text-muted-foreground">
              Ảnh đại diện (không bắt buộc)
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text variant="large" className="font-semibold">
            Tên nhóm
          </Text>

          <TextInput
            className="rounded-lg border border-border bg-card p-3 text-base text-foreground focus:border-primary"
            placeholder="Đặt tên cho nhóm của bạn"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View className="gap-2">
          <Text variant="large" className="font-semibold">
            Quyền riêng tư
          </Text>
          <View className="mt-2 gap-3">
            <Button
              variant={privacy === 'public' ? 'default' : 'outline'}
              className={`h-auto flex-row justify-start gap-3 p-4 ${privacy === 'public' ? 'border-primary bg-primary/10' : 'border-border'}`}
              onPress={() => setPrivacy('public')}>
              <View
                className={`rounded-full p-2 ${privacy === 'public' ? 'bg-primary' : 'bg-muted'}`}>
                <Ionicons
                  name="earth"
                  size={24}
                  color={privacy === 'public' ? 'white' : colors.mutedForeground}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${privacy === 'public' ? 'text-primary' : 'text-foreground'}`}>
                  Công khai
                </Text>
                <Text
                  variant="small"
                  className={`${privacy === 'public' ? 'text-primary/80' : 'text-muted-foreground'} mt-1`}>
                  Bất kỳ ai cũng có thể tìm thấy nhóm và xem bài viết.
                </Text>
              </View>
            </Button>

            <Button
              variant={privacy === 'private' ? 'default' : 'outline'}
              className={`h-auto flex-row justify-start gap-3 p-4 ${privacy === 'private' ? 'border-primary bg-primary/10' : 'border-border'}`}
              onPress={() => setPrivacy('private')}>
              <View
                className={`rounded-full p-2 ${privacy === 'private' ? 'bg-primary' : 'bg-muted'}`}>
                <Ionicons
                  name="lock-closed"
                  size={24}
                  color={privacy === 'private' ? 'white' : colors.mutedForeground}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${privacy === 'private' ? 'text-primary' : 'text-foreground'}`}>
                  Riêng tư
                </Text>
                <Text
                  variant="small"
                  className={`${privacy === 'private' ? 'text-primary/80' : 'text-muted-foreground'} mt-1`}>
                  Chỉ thành viên mới có thể xem bài viết trong nhóm.
                </Text>
              </View>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
