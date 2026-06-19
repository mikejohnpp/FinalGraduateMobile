import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroupMemberRequests } from '@/hooks/useGroupAdmin';

export default function GroupAdminMemberRequestsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const {
        members,
        loading,
        approve,
        reject,
        loadMore,
        hasNext,
    } = useGroupMemberRequests(id);

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-card p-4 rounded-xl shadow-sm border border-border mb-3">
            <View className="flex-row items-center gap-3 mb-3">
                {item.avatarUrl ? (
                    <Image
                        source={{ uri: item.avatarUrl }}
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                        contentFit="cover"
                    />
                ) : (
                    <View className="size-12 rounded-full bg-muted items-center justify-center">
                        <Text className="font-semibold text-muted-foreground text-lg">
                            {item.username.slice(0, 2).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View className="flex-1">
                    <Text className="font-semibold">{item.username}</Text>
                    {item.joinedPlatformAt && (
                        <Text variant="small" className="text-muted-foreground">
                            Đã tham gia nền tảng từ {new Date(item.joinedPlatformAt).getFullYear()}
                        </Text>
                    )}
                </View>
            </View>
            <View className="flex-row gap-2">
                <Button className="flex-1" onPress={() => approve(item.id)}>
                    <Text className="text-primary-foreground">Phê duyệt</Text>
                </Button>
                <Button variant="outline" className="flex-1" onPress={() => reject(item.id)}>
                    <Text>Từ chối</Text>
                </Button>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-muted" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header */}
            <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-2">
                <Button variant="ghost" className="h-auto p-1" onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="hsl(240, 5.9%, 10%)" />
                </Button>
                <Text variant="large">Yêu cầu tham gia</Text>
            </View>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerClassName="p-4"
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center py-10 opacity-70">
                            <Ionicons name="people-outline" size={48} color="hsl(240, 3.8%, 46.1%)" className="mb-2" />
                            <Text variant="large" className="text-muted-foreground">Không có yêu cầu nào</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    loading ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator />
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
