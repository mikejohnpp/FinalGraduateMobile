// Cấu hình Expo động — đọc biến môi trường từ file .env (Expo tự load vào process.env).
// Thay cho app.json tĩnh để tách secret (Supabase, API) ra khỏi code và không commit.
// Sau khi đổi .env cần restart Metro với cache clear: `npx expo start -c`.
export default {
  expo: {
    name: 'FinalGraduateMobile',
    slug: 'final-graduate-mobile',
    scheme: 'fgmobile',
    version: '1.0.0',
    web: {
      favicon: './assets/favicon.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      'expo-router',
      [
        '@config-plugins/react-native-webrtc',
        {
          cameraPermission: 'Cho phép $(PRODUCT_NAME) truy cập camera của bạn',
          microphonePermission: 'Cho phép $(PRODUCT_NAME) truy cập microphone của bạn',
        },
      ],
    ],
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bitcode: false,
      bundleIdentifier: 'com.anonymous.finalgraduatemobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.CAMERA',
        'android.permission.INTERNET',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.WAKE_LOCK',
        'android.permission.BLUETOOTH',
      ],
      package: 'com.anonymous.finalgraduatemobile',
    },
    // Giá trị đọc từ .env (process.env). Có fallback để chạy được ở môi trường dev cục bộ.
    extra: {
      serverApi: process.env.SERVER_API ?? 'http://localhost:8080',
      wsUrl: process.env.WS_URL ?? 'ws://localhost:9091/app_socket',
      // Storage: 'r2' (mặc định, khớp web) hoặc 'supabase' (fallback).
      storageProvider: process.env.STORAGE_PROVIDER ?? 'r2',
      // Cloudflare R2 — dùng S3-compatible API, ký SigV4 ở lib/mediaStorage/sigv4.ts.
      r2AccountId: process.env.R2_ACCOUNT_ID ?? '',
      r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      r2Bucket: process.env.R2_BUCKET ?? 'media',
      r2PublicUrl: process.env.R2_PUBLIC_URL ?? '',
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseKey: process.env.SUPABASE_KEY ?? '',
      supabaseMediaBucket: process.env.SUPABASE_MEDIA_BUCKET ?? 'media',
      turnUsername: process.env.TURN_USERNAME ?? '',
      turnCredential: process.env.TURN_CREDENTIAL ?? '',
    },
  },
};
