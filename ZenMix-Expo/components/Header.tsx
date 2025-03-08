import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import ZenLogo from './ZenLogo';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  isAuthenticated: boolean | null;
}

export default function Header({ isAuthenticated }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  function handleLogin() {
    router.push('/auth');
  }
  
  return (
    <View style={[
      styles.container,
      { paddingTop: Platform.OS === 'web' ? 16 : insets.top }
    ]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <ZenLogo size={24} color="#fff" />
          <Text style={styles.title}>ZenMix</Text>
        </View>
        <View style={styles.rightContainer}>
          <Text style={styles.subtitle}>by Medit8</Text>
          {!isAuthenticated && (
            <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
              <LogIn size={20} color="#2563eb" />
              <Text style={styles.authButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
  },
  authButtonText: {
    fontSize: 14,
    color: '#2563eb',
  },
});