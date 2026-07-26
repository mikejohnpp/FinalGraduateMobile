// useTheme — quản lý giao diện sáng/tối, port ý tưởng từ web (ThemeProvider + ThemeToggle).
// Web dùng next-themes (light/dark/system) lưu ở localStorage key "fg-theme".
// Mobile: dùng colorScheme của NativeWind để bật/tắt class `dark`, lưu lựa chọn qua AsyncStorage.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'nativewind';
import { storage } from '@/lib/storage';
import { LIGHT_COLORS, DARK_COLORS } from '@/lib/theme';


export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'fg-theme';

interface ThemeContextValue {
    // Lựa chọn của người dùng (light/dark/system).
    preference: ThemePreference;
    // Giao diện đang áp dụng thực tế (light/dark) sau khi phân giải "system".
    resolvedTheme: 'light' | 'dark';
    setPreference: (pref: ThemePreference) => void;
    hydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Hook của NativeWind: reactive — component sẽ re-render khi theme đổi,
    // và setColorScheme cập nhật class `dark` để các biến CSS chuyển theo.
    const { colorScheme, setColorScheme } = useColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>('system');
    const [hydrated, setHydrated] = useState(false);

    // Đọc lựa chọn đã lưu khi khởi động rồi áp dụng ngay.
    useEffect(() => {
        (async () => {
            const saved = (await storage.get(THEME_STORAGE_KEY)) as ThemePreference | null;
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                setPreferenceState(saved);
                setColorScheme(saved);
            }
            setHydrated(true);
        })();
    }, [setColorScheme]);

    // Giao diện thực tế do NativeWind phân giải (đã tính cả "system").
    const resolvedTheme: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';

    const setPreference = (pref: ThemePreference) => {
        setPreferenceState(pref);
        setColorScheme(pref); // cập nhật NativeWind → bật/tắt class `dark`
        storage.set(THEME_STORAGE_KEY, pref);
    };

    return (
        <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference, hydrated }}>
            {children}
        </ThemeContext.Provider>
    );
}


export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme phải được dùng bên trong <ThemeProvider>');
    }
    return ctx;
}

// Trả về bảng màu (icon/nền) theo theme đang áp dụng — reactive theo sáng/tối.
// Dùng cho các chỗ RN cần màu tường minh (Ionicons, style inline...).
export function useThemeColors() {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}
