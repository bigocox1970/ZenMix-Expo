export default {
  expo: {
    name: 'bolt-expo-nativewind',
    slug: 'bolt-expo-nativewind',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.zenmix.app',
      buildNumber: '1.0.0',
      infoPlist: {
        UIBackgroundModes: ['audio']
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000'
      },
      package: 'com.zenmix.app',
      versionCode: 1,
      softwareKeyboardLayoutMode: 'pan'
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
      viewport: {
        width: 768,
        scale: 1.0,
        maximumScale: 1.0,
        userScalable: false
      },
      build: {
        babel: {
          include: ['@expo/vector-icons']
        }
      },
      style: {
        content: `
          #root {
            display: flex;
            justify-content: center;
            background-color: #121212;
            min-height: 100vh;
          }
          #root > * {
            max-width: 768px;
            width: 100%;
            margin: 0 auto;
            background-color: #000;
          }
        `
      }
    },
    plugins: [
      'expo-router',
      [
        'expo-av',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone.'
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};