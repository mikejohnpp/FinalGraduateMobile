// MediaGallery — render danh sách media của post/comment. Port ý tưởng từ web (MediaGallery.tsx).
// Bố cục ảnh kiểu Facebook (mosaic) tuỳ số lượng; video/audio/file render đơn giản.
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import type { MediaItem } from '@/types';

interface MediaGalleryProps {
    media: MediaItem[] | undefined | null;
    // Kích thước hiển thị: "post" (lớn) hoặc "comment" (nhỏ gọn).
    size?: 'post' | 'comment';
}

const GAP = 4;

// Lấy tên file từ URL để hiển thị cho FILE/AUDIO.
function fileNameFromUrl(url: string): string {
    try {
        const path = url.split('?')[0];
        const name = path.substring(path.lastIndexOf('/') + 1);
        return decodeURIComponent(name) || 'Tệp đính kèm';
    } catch {
        return 'Tệp đính kèm';
    }
}

function ImageTile({
    item,
    width,
    height,
    overlayCount,
    onPress,
}: {
    item: MediaItem;
    width: number;
    height: number;
    overlayCount?: number;
    onPress?: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={{ width, height }}>
            <Image
                source={{ uri: item.url }}
                style={{ width, height, borderRadius: 8, backgroundColor: 'hsl(240,4.8%,95.9%)' }}
                contentFit="cover"
            />
            {overlayCount && overlayCount > 0 ? (
                <View
                    className="items-center justify-center rounded-lg"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width,
                        height,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                    }}>
                    <Text className="text-2xl font-semibold text-white">+{overlayCount}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

// Bố cục ảnh kiểu Facebook (mosaic) tuỳ số lượng ảnh.
function ImageMosaic({
    images,
    containerWidth,
    isComment,
    onOpen,
}: {
    images: MediaItem[];
    containerWidth: number;
    isComment: boolean;
    onOpen: (index: number) => void;
}) {
    const count = images.length;
    const w = containerWidth;
    const heightCap = isComment ? 220 : 400;

    if (count === 1) {
        return (
            <ImageTile item={images[0]} width={w} height={heightCap} onPress={() => onOpen(0)} />
        );
    }

    if (count === 2) {
        const size = (w - GAP) / 2;
        return (
            <View style={{ flexDirection: 'row', gap: GAP }}>
                {images.map((item, i) => (
                    <ImageTile key={item.id} item={item} width={size} height={size} onPress={() => onOpen(i)} />
                ))}
            </View>
        );
    }

    if (count === 3) {
        const h = isComment ? 220 : 300;
        const leftW = (w - GAP) / 2;
        const rightH = (h - GAP) / 2;
        return (
            <View style={{ flexDirection: 'row', gap: GAP, height: h }}>
                <ImageTile item={images[0]} width={leftW} height={h} onPress={() => onOpen(0)} />
                <View style={{ gap: GAP }}>
                    <ImageTile item={images[1]} width={leftW} height={rightH} onPress={() => onOpen(1)} />
                    <ImageTile item={images[2]} width={leftW} height={rightH} onPress={() => onOpen(2)} />
                </View>
            </View>
        );
    }

    if (count === 4) {
        const size = (w - GAP) / 2;
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                {images.map((item, i) => (
                    <ImageTile key={item.id} item={item} width={size} height={size} onPress={() => onOpen(i)} />
                ))}
            </View>
        );
    }

    // >= 5: 2 ảnh hàng trên + 3 ảnh hàng dưới, ô cuối phủ "+N".
    const top = images.slice(0, 2);
    const bottom = images.slice(2, 5);
    const remaining = count - 5;
    const topW = (w - GAP) / 2;
    const topH = topW * 0.75;
    const botSize = (w - GAP * 2) / 3;

    return (
        <View style={{ gap: GAP }}>
            <View style={{ flexDirection: 'row', gap: GAP }}>
                {top.map((item, i) => (
                    <ImageTile key={item.id} item={item} width={topW} height={topH} onPress={() => onOpen(i)} />
                ))}
            </View>
            <View style={{ flexDirection: 'row', gap: GAP }}>
                {bottom.map((item, idx) => {
                    const isLast = idx === bottom.length - 1;
                    return (
                        <ImageTile
                            key={item.id}
                            item={item}
                            width={botSize}
                            height={botSize}
                            overlayCount={isLast && remaining > 0 ? remaining : undefined}
                            onPress={() => onOpen(idx + 2)}
                        />
                    );
                })}
            </View>
        </View>
    );
}

export default function MediaGallery({ media, size = 'post' }: MediaGalleryProps) {
    const { width: screenWidth } = useWindowDimensions();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!media || media.length === 0) return null;

    const images = media.filter((m) => m.mediaType === 'IMAGE');
    const videos = media.filter((m) => m.mediaType === 'VIDEO');
    const audios = media.filter((m) => m.mediaType === 'AUDIO');
    const files = media.filter((m) => m.mediaType === 'FILE');

    const isComment = size === 'comment';
    // Trừ padding ngang của card (~32) + lề khi là comment.
    const containerWidth = screenWidth - (isComment ? 96 : 32);

    return (
        <View style={{ gap: 8 }}>
            {images.length > 0 && (
                <ImageMosaic
                    images={images}
                    containerWidth={containerWidth}
                    isComment={isComment}
                    onOpen={(i) => setLightboxIndex(i)}
                />
            )}

            {/* Video — hiển thị ô bấm mở bằng trình xem ngoài (RN không có <video> mặc định) */}
            {videos.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => Linking.openURL(item.url)}
                    className="items-center justify-center rounded-lg bg-black"
                    style={{ width: containerWidth, height: isComment ? 200 : 240 }}>
                    <Ionicons name="play-circle" size={56} color="#ffffff" />
                    <Text className="mt-1 text-xs text-white">Nhấn để phát video</Text>
                </Pressable>
            ))}

            {/* Audio */}
            {audios.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => Linking.openURL(item.url)}
                    className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <Ionicons name="musical-notes-outline" size={20} color="hsl(240,3.8%,46.1%)" />
                    <Text className="flex-1 text-sm" numberOfLines={1}>
                        {fileNameFromUrl(item.url)}
                    </Text>
                </Pressable>
            ))}

            {/* File đính kèm */}
            {files.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => Linking.openURL(item.url)}
                    className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <Ionicons name="document-outline" size={20} color="hsl(240,3.8%,46.1%)" />
                    <Text className="flex-1 text-sm" numberOfLines={1}>
                        {fileNameFromUrl(item.url)}
                    </Text>
                    <Ionicons name="download-outline" size={18} color="hsl(240,3.8%,46.1%)" />
                </Pressable>
            ))}

            {/* Lightbox xem ảnh full-screen */}
            <Modal
                visible={lightboxIndex !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setLightboxIndex(null)}>
                <View className="flex-1 bg-black">
                    <Pressable
                        onPress={() => setLightboxIndex(null)}
                        style={{ position: 'absolute', top: 48, right: 20, zIndex: 10 }}>
                        <Ionicons name="close" size={32} color="#ffffff" />
                    </Pressable>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentOffset={{ x: (lightboxIndex ?? 0) * screenWidth, y: 0 }}
                        style={{ flex: 1 }}>
                        {images.map((item) => (
                            <View
                                key={item.id}
                                style={{ width: screenWidth }}
                                className="items-center justify-center">
                                <Image
                                    source={{ uri: item.url }}
                                    style={{ width: screenWidth, height: '100%' }}
                                    contentFit="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
