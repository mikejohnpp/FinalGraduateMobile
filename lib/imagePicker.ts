// Tiện ích chọn ảnh từ thư viện, xin quyền và trả về URI (hoặc null nếu huỷ/không có quyền).
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickImage(aspect?: [number, number]): Promise<string | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Hãy cấp quyền truy cập thư viện ảnh để tiếp tục.');
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
}
