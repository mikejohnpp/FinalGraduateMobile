import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { pickMedia } from '@/lib/imagePicker';
import { uploadPickedMediaFiles, MAX_MEDIA_SIZE_MB, type PickedMedia } from '@/lib/mediaUpload';
import type { MediaInput } from '@/types';

export interface DraftMedia extends PickedMedia {
  id: string;
}

let seq = 0;
const nextId = () => `m-${Date.now()}-${seq++}`;

export function useMediaUpload() {
  const [drafts, setDrafts] = useState<DraftMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickAndAdd = useCallback(async () => {
    const picked = await pickMedia();
    if (!picked.length) return;

    const valid: DraftMedia[] = [];
    for (const item of picked) {
      if (item.fileSize && item.fileSize > MAX_MEDIA_SIZE_MB * 1024 * 1024) {
        Alert.alert('Tệp quá lớn', `Một tệp vượt quá ${MAX_MEDIA_SIZE_MB}MB và đã bị bỏ qua.`);
        continue;
      }
      valid.push({ ...item, id: nextId() });
    }
    if (valid.length) setDrafts((prev) => [...prev, ...valid]);
  }, []);

  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clear = useCallback(() => setDrafts([]), []);

  const upload = useCallback(async (): Promise<MediaInput[] | null> => {
    if (drafts.length === 0) return [];
    setUploading(true);
    try {
      return await uploadPickedMediaFiles(drafts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tải lên media thất bại';
      Alert.alert('Lỗi', msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, [drafts]);

  return {
    drafts,
    uploading,
    hasMedia: drafts.length > 0,
    pickAndAdd,
    removeDraft,
    clear,
    upload,
  };
}
