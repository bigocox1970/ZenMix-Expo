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