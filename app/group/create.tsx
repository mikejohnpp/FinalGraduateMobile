import React, { useState } from 'react';
import { View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupActions } from '@/hooks/useGroup';
import { useThemeColors } from '@/hooks/useTheme';

export default function CreateGroupScreen() {
  const colors = useThemeColors();
    const router = useRouter();
    const { createGroup, loading } = useGroupActions();
    
    const [name, setName] = useState('');
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
            return;
        }
        
        const newGroup = await createGroup({
            name: name.trim(),
            privacy
        });
        
        if (newGroup) {
            router.replace(`/group/${newGroup.id}`);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-2">
                <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.foreground} />
                </Button>
                <Text variant="large" className="font-semibold">Tạo nhóm</Text>
                <Button 
                    variant="ghost" 
                    className="h-auto px-2 py-1" 
                    disabled={!name.trim() || loading} 
                    onPress={handleCreate}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.foreground} />
                    ) : (
                        <Text className={!name.trim() ? "text-muted-foreground" : "text-primary font-semibold"}>
                            Tạo
                        </Text>
                    )}
                </Button>
            </View>

            <View className="flex-1 p-4 gap-6">
                <View className="gap-2">
                    <Text variant="large" className="font-semibold">Tên nhóm</Text>
                    <TextInput
                        className="rounded-lg border border-border bg-card p-3 text-base text-foreground focus:border-primary"
                        placeholder="Đặt tên cho nhóm của bạn"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                <View className="gap-2">
                    <Text variant="large" className="font-semibold">Quyền riêng tư</Text>
                    <View className="gap-3 mt-2">
                        <Button
                            variant={privacy === 'public' ? 'default' : 'outline'}
                            className={`flex-row justify-start gap-3 p-4 h-auto ${privacy === 'public' ? 'bg-primary/10 border-primary' : 'border-border'}`}
                            onPress={() => setPrivacy('public')}
                        >
                            <View className={`rounded-full p-2 ${privacy === 'public' ? 'bg-primary' : 'bg-muted'}`}>
                                <Ionicons name="earth" size={24} color={privacy === 'public' ? 'white' : colors.mutedForeground} />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-base ${privacy === 'public' ? 'text-primary' : 'text-foreground'}`}>Công khai</Text>
                                <Text variant="small" className={`${privacy === 'public' ? 'text-primary/80' : 'text-muted-foreground'} mt-1`}>
                                    Bất kỳ ai cũng có thể tìm thấy nhóm và xem bài viết.
                                </Text>
                            </View>
                        </Button>

                        <Button
                            variant={privacy === 'private' ? 'default' : 'outline'}
                            className={`flex-row justify-start gap-3 p-4 h-auto ${privacy === 'private' ? 'bg-primary/10 border-primary' : 'border-border'}`}
                            onPress={() => setPrivacy('private')}
                        >
                            <View className={`rounded-full p-2 ${privacy === 'private' ? 'bg-primary' : 'bg-muted'}`}>
                                <Ionicons name="lock-closed" size={24} color={privacy === 'private' ? 'white' : colors.mutedForeground} />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-base ${privacy === 'private' ? 'text-primary' : 'text-foreground'}`}>Riêng tư</Text>
                                <Text variant="small" className={`${privacy === 'private' ? 'text-primary/80' : 'text-muted-foreground'} mt-1`}>
                                    Chỉ thành viên mới có thể xem bài viết trong nhóm.
                                </Text>
                            </View>
                        </Button>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
