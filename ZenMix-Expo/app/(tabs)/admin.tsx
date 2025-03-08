import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Ban, Crown, Search, Shield, ShieldAlert, ShieldCheck, UserCheck, UserX } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import LoginOverlay from '@/components/LoginOverlay';

interface Profile {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  subscription_type: string;
  created_at: string;
}

export default function AdminScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        if (session) {
          fetchUsers();
          checkAdminStatus();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkAuthStatus() {
    try {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      if (data.session) {
        fetchUsers();
        checkAdminStatus();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(userId: string, updates: Partial<Profile>) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id);

      if (error) throw error;
      setIsAdmin(data && data.length > 0 ? data[0].is_admin : false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
    }
  }

  const renderUserCard = ({ item }: { item: Profile }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={24} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.userId}>ID: {item.id}</Text>
        </View>
      </View>

      <View style={styles.badges}>
        {item.is_admin && (
          <View style={[styles.badge, { backgroundColor: '#7c3aed' }]}>
            <Crown size={16} color="#fff" />
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        )}
        <View style={[styles.badge, { 
          backgroundColor: item.subscription_type === 'pro' ? '#2563eb' : '#374151'
        }]}>
          <Text style={styles.badgeText}>
            {item.subscription_type === 'pro' ? 'Pro' : 'Free'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, item.is_admin && styles.actionButtonActive]}
          onPress={() => updateUserStatus(item.id, { is_admin: !item.is_admin })}
        >
          <Crown size={20} color={item.is_admin ? '#7c3aed' : '#666'} />
          <Text style={[styles.actionText, item.is_admin && styles.actionTextActive]}>
            {item.is_admin ? 'Remove Admin' : 'Make Admin'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, item.is_suspended && styles.actionButtonDanger]}
          onPress={() => updateUserStatus(item.id, { is_suspended: !item.is_suspended })}
        >
          <Ban size={20} color={item.is_suspended ? '#ef4444' : '#666'} />
          <Text style={[styles.actionText, item.is_suspended && styles.actionTextDanger]}>
            {item.is_suspended ? 'Unsuspend' : 'Suspend'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !isAdmin ? (
          <View style={styles.unauthorizedContainer}>
            <Text style={styles.unauthorizedText}>
              You do not have permission to access this page.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <FlatList
              data={users.filter(user => 
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.nickname && user.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
              )}
              renderItem={renderUserCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.usersList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              }
            />
          </>
        )}
      </View>
      
      <LoginOverlay 
        visible={isAuthenticated === false} 
        message="Please log in with an admin account to access the admin panel."
        onLogin={() => setIsAuthenticated(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  usersList: {
    paddingBottom: 16,
  },
  userCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#666',
  },
  badges: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#4c1d95',
  },
  actionButtonDanger: {
    backgroundColor: '#7f1d1d',
  },
  actionText: {
    color: '#aaa',
    marginLeft: 8,
    fontSize: 14,
  },
  actionTextActive: {
    color: '#fff',
  },
  actionTextDanger: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  unauthorizedText: {
    color: '#ef4444',
    fontSize: 18,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
}); 


