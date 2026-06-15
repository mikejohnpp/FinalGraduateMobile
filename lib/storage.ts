// Bọc AsyncStorage thay cho localStorage của web (mọi thao tác đều async).
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async get(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch {
            return null;
        }
    },

    async set(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch {
            // bỏ qua lỗi ghi
        }
    },

    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch {
            // bỏ qua lỗi xoá
        }
    },

    async multiRemove(keys: string[]): Promise<void> {
        try {
            await AsyncStorage.multiRemove(keys);
        } catch {
            // bỏ qua
        }
    },
};
