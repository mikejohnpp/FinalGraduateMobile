// MediaGallery — render danh sách media của post/comment. Port ý tưởng từ web (MediaGallery.tsx).
// Bố cục ảnh kiểu Facebook (mosaic) tuỳ số lượng; video phát tại chỗ (tap-to-play) bằng
// expo-video, audio phát tại chỗ bằng expo-audio; chỉ FILE mới mở ra ngoài để tải về.
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    View,
    useWindowDimensions,
    type GestureResponderEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/lib/media';
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
    radius = 0,
    overlayCount,
    onPress,
}: {
    item: MediaItem;
    width: number;
    height: number;
    radius?: number;
    overlayCount?: number;
    onPress?: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable onPress={onPress} style={{ width, height }}>
            <Image
                source={{ uri: item.url }}
                style={{ width, height, borderRadius: radius, backgroundColor: colors.muted }}
                contentFit="cover"
            />
            {overlayCount && overlayCount > 0 ? (
                <View
                    className="items-center justify-center"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width,
                        height,
                        borderRadius: radius,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                    }}>
                    <Text className="text-2xl font-semibold text-white">+{overlayCount}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

// Khung hiển thị 1 ảnh: chiều cao khung co theo tỉ lệ thật của ảnh, `maxHeight` chỉ là
// giới hạn trên. Ảnh ngang/vuông fill trọn khung (cover) nên không có dải mờ nào; chỉ khi
// ảnh quá cao và bị cắt trần mới dùng nền blur kiểu letterbox như web.
function SingleImageFrame({
    item,
    width,
    maxHeight,
    radius = 0,
    onPress,
}: {
    item: MediaItem;
    width: number;
    maxHeight: number;
    radius?: number;
    onPress?: () => void;
}) {
    const colors = useThemeColors();
    // ratio = width / height của ảnh gốc; null khi chưa load xong.
    const [ratio, setRatio] = useState<number | null>(null);

    // Trước khi biết tỉ lệ, dùng 4:3 làm placeholder để tránh nhảy layout quá mạnh.
    const naturalHeight = ratio ? width / ratio : width * 0.75;
    const height = Math.min(naturalHeight, maxHeight);
    // Ảnh cao hơn trần -> phải contain + nền mờ, nếu không sẽ bị crop.
    const clipped = naturalHeight > maxHeight + 1;

    return (
        <Pressable
            onPress={onPress}
            style={{
                width,
                height,
                borderRadius: radius,
                overflow: 'hidden',
                backgroundColor: clipped ? '#000' : colors.muted,
            }}>
            {clipped ? (
                <>
                    {/* Nền mờ lấp hai bên viền khi ảnh bị giới hạn chiều cao */}
                    <Image
                        source={{ uri: item.url }}
                        style={{ position: 'absolute', width, height, transform: [{ scale: 1.1 }] }}
                        contentFit="cover"
                        blurRadius={20}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            width,
                            height,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                        }}
                    />
                </>
            ) : null}
            <Image
                source={{ uri: item.url }}
                style={{ width, height }}
                contentFit={clipped ? 'contain' : 'cover'}
                onLoad={(e) => {
                    const { width: w, height: h } = e.source;
                    if (w > 0 && h > 0) setRatio(w / h);
                }}
            />
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
    // Ảnh trong post tràn hết chiều rộng nên bỏ bo góc; comment vẫn bo 8.
    const radius = isComment ? 8 : 0;

    if (count === 1) {
        return (
            <SingleImageFrame
                item={images[0]}
                width={w}
                maxHeight={heightCap}
                radius={radius}
                onPress={() => onOpen(0)}
            />
        );
    }

    // 2 và 3 ảnh: dán liền nhau, không khe.
    if (count === 2) {
        const size = w / 2;
        return (
            <View style={{ flexDirection: 'row' }}>
                {images.map((item, i) => (
                    <ImageTile
                        key={item.id}
                        item={item}
                        width={size}
                        height={size}
                        radius={radius}
                        onPress={() => onOpen(i)}
                    />
                ))}
            </View>
        );
    }

    if (count === 3) {
        const h = isComment ? 220 : 300;
        const colW = w / 2;
        const rightH = h / 2;
        return (
            <View style={{ flexDirection: 'row', height: h }}>
                <ImageTile
                    item={images[0]}
                    width={colW}
                    height={h}
                    radius={radius}
                    onPress={() => onOpen(0)}
                />
                <View>
                    <ImageTile
                        item={images[1]}
                        width={colW}
                        height={rightH}
                        radius={radius}
                        onPress={() => onOpen(1)}
                    />
                    <ImageTile
                        item={images[2]}
                        width={colW}
                        height={rightH}
                        radius={radius}
                        onPress={() => onOpen(2)}
                    />
                </View>
            </View>
        );
    }

    if (count === 4) {
        const size = (w - GAP) / 2;
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                {images.map((item, i) => (
                    <ImageTile
                        key={item.id}
                        item={item}
                        width={size}
                        height={size}
                        radius={radius}
                        onPress={() => onOpen(i)}
                    />
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
                    <ImageTile
                        key={item.id}
                        item={item}
                        width={topW}
                        height={topH}
                        radius={radius}
                        onPress={() => onOpen(i)}
                    />
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
                            radius={radius}
                            overlayCount={isLast && remaining > 0 ? remaining : undefined}
                            onPress={() => onOpen(idx + 2)}
                        />
                    );
                })}
            </View>
        </View>
    );
}

// Giây -> "m:ss" để hiển thị tiến trình audio.
function formatTime(seconds: number): string {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Bề mặt phát video thật. Tách riêng để `useVideoPlayer` chỉ chạy sau khi người dùng bấm play,
// nhờ vậy feed nhiều video không cùng lúc tải/buffer.
function VideoSurface({
    uri,
    width,
    height,
    radius,
}: {
    uri: string;
    width: number;
    height: number;
    radius: number;
}) {
    const player = useVideoPlayer(uri, (p) => {
        p.loop = false;
        p.play();
    });

    return (
        <VideoView
            player={player}
            style={{ width, height, borderRadius: radius, backgroundColor: '#000' }}
            contentFit="contain"
            nativeControls
        />
    );
}

// Ô video trong bài viết: mặc định là ảnh nền đen + nút play; bấm mới mount trình phát.
function VideoTile({
    width,
    height,
    radius,
    uri,
}: {
    width: number;
    height: number;
    radius: number;
    uri: string;
}) {
    const [playing, setPlaying] = useState(false);

    if (playing) {
        return <VideoSurface uri={uri} width={width} height={height} radius={radius} />;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Phát video"
            onPress={() => setPlaying(true)}
            className="items-center justify-center"
            style={{ width, height, borderRadius: radius, backgroundColor: '#000' }}>
            <Ionicons name="play-circle" size={56} color="#ffffff" />
            <Text className="mt-1 text-xs text-white">Nhấn để phát video</Text>
        </Pressable>
    );
}

// Thanh phát audio: play/pause, thời lượng và thanh tiến trình bấm để tua.
function AudioPlayerBar({ uri, name }: { uri: string; name: string }) {
    const colors = useThemeColors();
    const player = useAudioPlayer({ uri });
    const status = useAudioPlayerStatus(player);
    const [barWidth, setBarWidth] = useState(0);

    // iOS: cho phép phát khi máy đang ở chế độ im lặng.
    useEffect(() => {
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => { });
    }, []);

    // Tự phát ngay khi thanh được mount (người dùng vừa bấm play ở ô placeholder).
    useEffect(() => {
        player.play();
    }, [player]);

    // Phát hết thì tua về đầu để bấm play lại được ngay.
    useEffect(() => {
        if (status.didJustFinish) {
            player.pause();
            player.seekTo(0).catch(() => { });
        }
    }, [status.didJustFinish, player]);

    const duration = status.duration || 0;
    const current = Math.min(status.currentTime || 0, duration || Number.MAX_SAFE_INTEGER);
    const progress = duration > 0 ? Math.min(current / duration, 1) : 0;

    const handleSeek = useCallback(
        (e: GestureResponderEvent) => {
            if (!duration || barWidth <= 0) return;
            const ratio = Math.max(0, Math.min(e.nativeEvent.locationX / barWidth, 1));
            player.seekTo(ratio * duration).catch(() => { });
        },
        [barWidth, duration, player],
    );

    return (
        <View className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={status.playing ? 'Tạm dừng' : 'Phát'}
                onPress={() => (status.playing ? player.pause() : player.play())}
                className="size-9 items-center justify-center rounded-full bg-primary/10 active:opacity-70">
                {!status.isLoaded || status.isBuffering ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Ionicons
                        name={status.playing ? 'pause' : 'play'}
                        size={18}
                        color={colors.primary}
                    />
                )}
            </Pressable>

            <View className="min-w-0 flex-1">
                <Text className="text-sm" numberOfLines={1}>
                    {name}
                </Text>
                <Pressable
                    accessibilityRole="adjustable"
                    accessibilityLabel="Tua audio"
                    onPress={handleSeek}
                    onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
                    className="mt-1 py-1.5">
                    <View
                        className="h-1 overflow-hidden rounded-full"
                        style={{ backgroundColor: colors.border }}>
                        <View
                            style={{
                                width: `${progress * 100}%`,
                                height: '100%',
                                backgroundColor: colors.primary,
                            }}
                        />
                    </View>
                </Pressable>
            </View>

            <Text variant="muted" className="text-xs tabular-nums">
                {formatTime(current)} / {formatTime(duration)}
            </Text>
        </View>
    );
}

// Ô audio: chỉ khởi tạo player khi người dùng bấm play (tránh N player nằm chờ trong feed).
function AudioTile({ uri, name }: { uri: string; name: string }) {
    const colors = useThemeColors();
    const [started, setStarted] = useState(false);

    if (started) return <AudioPlayerBar uri={uri} name={name} />;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Phát ${name}`}
            onPress={() => setStarted(true)}
            className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 active:opacity-70">
            <View className="size-9 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="play" size={18} color={colors.primary} />
            </View>
            <Text className="min-w-0 flex-1 text-sm" numberOfLines={1}>
                {name}
            </Text>
            <Ionicons name="musical-notes-outline" size={18} color={colors.mutedForeground} />
        </Pressable>
    );
}

export default function MediaGallery({ media, size = 'post' }: MediaGalleryProps) {
    const colors = useThemeColors();
    const { width: screenWidth } = useWindowDimensions();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!media || media.length === 0) return null;

    // Backend có thể trả đường dẫn tương đối (/uploads/...) — chuẩn hoá về URL tuyệt đối.
    const items = media.map((m) => ({ ...m, url: resolveMediaUrl(m.url) ?? m.url }));

    const images = items.filter((m) => m.mediaType === 'IMAGE');
    const videos = items.filter((m) => m.mediaType === 'VIDEO');
    const audios = items.filter((m) => m.mediaType === 'AUDIO');
    const files = items.filter((m) => m.mediaType === 'FILE');


    const isComment = size === 'comment';
    // Post: ảnh full-bleed nên dùng đúng chiều rộng màn hình (PostCard đã bù -mx-4).
    // Comment: trừ lề thụt vào của comment.
    const containerWidth = isComment ? screenWidth - 96 : screenWidth;

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

            {/* Video — phát tại chỗ bằng expo-video, chỉ nạp khi người dùng bấm play */}
            {videos.map((item) => (
                <VideoTile
                    key={item.id}
                    uri={item.url}
                    width={containerWidth}
                    height={isComment ? 200 : Math.min(Math.round((containerWidth * 9) / 16), 400)}
                    radius={isComment ? 8 : 0}
                />
            ))}

            {/* Audio — phát tại chỗ bằng expo-audio */}
            {audios.map((item) => (
                <AudioTile key={item.id} uri={item.url} name={fileNameFromUrl(item.url)} />
            ))}

            {/* File đính kèm */}
            {files.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => Linking.openURL(item.url)}
                    className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <Ionicons name="document-outline" size={20} color={colors.mutedForeground} />
                    <Text className="flex-1 text-sm" numberOfLines={1}>
                        {fileNameFromUrl(item.url)}
                    </Text>
                    <Ionicons name="download-outline" size={18} color={colors.mutedForeground} />
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
