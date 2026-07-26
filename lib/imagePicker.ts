// Tiện ích chọn ảnh/media từ thư viện, xin quyền và trả về URI (hoặc null nếu huỷ/không có quyền).
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { inferMediaType, type PickedMedia } from '@/lib/mediaUpload';

// Chọn 1 ảnh kèm metadata (URI + mimeType + fileName) — dùng cho avatar/cover của user & nhóm.
// mimeType cần cho việc đặt Content-Type khi upload lên storage.

export async function pickImageWithMeta(
    aspect?: [number, number],
): Promise<{ uri: string; mimeType?: string | null; fileName?: string | null } | null> {
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
    const asset = result.assets[0];
    return { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName };
}

// Chọn 1 video (dùng cho reel / story video). Trả về { uri, mimeType } hoặc null.
export async function pickVideo(): Promise<{
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
} | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Hãy cấp quyền truy cập thư viện để tiếp tục.');
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    return {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
    };
}

// Chọn nhiều media (ảnh/video) cho post & comment. Trả về danh sách PickedMedia.
export async function pickMedia(selectionLimit = 10): Promise<PickedMedia[]> {

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        Alert.alert('Cần quyền truy cập', 'Hãy cấp quyền truy cập thư viện ảnh để tiếp tục.');
        return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit,
        quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return [];

    return result.assets.map((asset) => {
        const mediaType =
            asset.type === 'video' ? 'VIDEO' : inferMediaType(asset.mimeType ?? 'image/jpeg');
        return {
            uri: asset.uri,
            mediaType,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            fileSize: asset.fileSize,
        } satisfies PickedMedia;
    });
}
