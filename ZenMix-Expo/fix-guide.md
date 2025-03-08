# Guide to Fix ZenMix App in Main Repository

Based on our analysis of the working version, here are the key changes needed to fix your main repository:

## 1. Fix Supabase Configuration

Update your `lib/supabase.ts` file to match this implementation:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Custom storage implementation for web platform
const webStorage = {
  getItem: (key: string) => {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve(void 0);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve(void 0);
  },
};

// Custom storage implementation for native platforms using SecureStore
const secureStorage = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value).then(() => void 0);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key).then(() => void 0);
  },
};

// Use appropriate storage for the platform
const storage = Platform.OS === 'web' ? webStorage : secureStorage;

// Hardcode the values for now to ensure they're available
const supabaseUrl = 'https://cwanrodziwwzsdihsazh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YW5yb2R6aXd3enNkaWhzYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMjMyODUsImV4cCI6MjA1NjU5OTI4NX0.HixlYLnvzmr4enX8Flo7097T2I3lPQVk9LBLtPJjwZQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure your environment variables are properly set in .env file.'
  );
}

// Initialize Supabase with appropriate storage adapter
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
```

## 2. Ensure Environment Variables are Set Up Correctly

Create or update your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://cwanrodziwwzsdihsazh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YW5yb2R6aXd3enNkaWhzYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMjMyODUsImV4cCI6MjA1NjU5OTI4NX0.HixlYLnvzmr4enX8Flo7097T2I3lPQVk9LBLtPJjwZQ
```

Also create a `.env.local` file with the same content.

## 3. Update app.config.js

Make sure your `app.config.js` includes the environment variables in the `extra` section:

```javascript
export default {
  expo: {
    // ... other config
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

## 4. Update package.json Scripts

Ensure your `package.json` scripts are compatible with Windows:

```json
"scripts": {
  "dev": "expo start --web",
  "dev:tunnel": "expo start --tunnel",
  "build:web": "expo export --platform web",
  "lint": "expo lint"
},
```

## 5. Install Dependencies

Run the following command to install dependencies with the force flag to resolve conflicts:

```
npm install --force
```

## 6. Start the App

For web:
```
npx expo start --web
```

For mobile with tunnel:
```
npx expo start --tunnel
```

## Common Issues and Solutions

1. **Dependency Conflicts**: Use `--force` or `--legacy-peer-deps` when installing packages
2. **Environment Variables Not Loading**: Hardcode the values in supabase.ts as a fallback
3. **SecureStore Implementation**: Make sure to properly implement the storage interface for both web and native platforms 