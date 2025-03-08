import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Modal, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { LogOut, User, Camera, ChevronRight, X, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import LoginOverlay from '@/components/LoginOverlay';

interface Profile {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  is_admin: boolean;
  subscription_type: string;
  default_duration: number;
  preferred_voice: string;
  preferred_background: string;
  notifications: boolean;
}

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];
const VOICE_OPTIONS = ['Female', 'Male', 'Neutral'];
const BACKGROUND_OPTIONS = [
  'Nature Sounds',
  'Ocean Waves',
  'Rain',
  'Forest',
  'White Noise',
  'Meditation Bells',
  'None'
];

type PreferenceType = 'duration' | 'voice' | 'background';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNickname, setEditedNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [currentPreference, setCurrentPreference] = useState<PreferenceType | null>(null);
  const [tempPreferenceValue, setTempPreferenceValue] = useState<string | number>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        if (session) {
          fetchProfile();
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
        fetchProfile();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedNickname(data.nickname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log out');
    }
  }

  async function handleUpdateProfile() {
    if (!profile) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: editedNickname,
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, nickname: editedNickname } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePreference() {
    if (!profile || !currentPreference) return;

    try {
      setLoading(true);
      const updates: Partial<Profile> = {};

      switch (currentPreference) {
        case 'duration':
          updates.default_duration = Number(tempPreferenceValue);
          break;
        case 'voice':
          updates.preferred_voice = String(tempPreferenceValue);
          break;
        case 'background':
          updates.preferred_background = String(tempPreferenceValue);
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setShowPreferenceModal(false);
      setCurrentPreference(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenPreference(type: PreferenceType) {
    setCurrentPreference(type);
    switch (type) {
      case 'duration':
        setTempPreferenceValue(profile?.default_duration || 15);
        break;
      case 'voice':
        setTempPreferenceValue(profile?.preferred_voice || 'Female');
        break;
      case 'background':
        setTempPreferenceValue(profile?.preferred_background || 'Nature Sounds');
        break;
    }
    setShowPreferenceModal(true);
  }

  function renderPreferenceOptions() {
    if (!currentPreference) return null;

    let options: (string | number)[] = [];
    switch (currentPreference) {
      case 'duration':
        options = DURATION_OPTIONS;
        break;
      case 'voice':
        options = VOICE_OPTIONS;
        break;
      case 'background':
        options = BACKGROUND_OPTIONS;
        break;
    }

    return options.map((option) => (
      <TouchableOpacity
        key={option}
        style={[
          styles.preferenceOption,
          tempPreferenceValue === option && styles.preferenceOptionSelected
        ]}
        onPress={() => setTempPreferenceValue(option)}
      >
        <Text style={[
          styles.preferenceOptionText,
          tempPreferenceValue === option && styles.preferenceOptionTextSelected
        ]}>
          {currentPreference === 'duration' ? `${option} minutes` : option}
        </Text>
        {tempPreferenceValue === option && (
          <Check size={20} color="#fff" />
        )}
      </TouchableOpacity>
    ));
  }

  async function handleUpdateAvatar() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Selected image:', asset);

        // First, remove old avatar if exists
        if (profile?.avatar_url) {
          const oldFileName = profile.avatar_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('avatars')
              .remove([oldFileName]);
          }
        }

        // Get file extension from mime type
        const mimeType = asset.mimeType || 'image/jpeg';
        const ext = mimeType.split('/')[1];
        
        // Create a unique file name
        const fileName = `avatar-${profile?.id}-${Date.now()}.${ext}`;
        console.log('New file name:', fileName);

        // Convert base64 to blob
        const base64Data = asset.base64;
        if (!base64Data) {
          throw new Error('Failed to get image data');
        }

        // Create blob
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        console.log('Created blob:', blob.size, 'bytes');

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('Public URL:', publicUrl);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile?.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }

        // Update local state
        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        Alert.alert('Success', 'Avatar updated successfully');
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  }

  const handleToggleNotifications = async (value: boolean) => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ notifications: value })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, notifications: value } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          
          {profile ? (
            <>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {profile.avatar_url ? (
                    <Image 
                      source={{ uri: profile.avatar_url }} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={40} color="#666" />
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.avatarEditButton}
                    onPress={handleUpdateAvatar}
                  >
                    <Camera size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.profileInfo}>
                  {isEditing ? (
                    <TextInput
                      style={styles.nameInput}
                      value={editedNickname}
                      onChangeText={setEditedNickname}
                      placeholder="Enter your name"
                      placeholderTextColor="#666"
                    />
                  ) : (
                    <Text style={styles.profileName}>{profile.nickname}</Text>
                  )}
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                  
                  {isEditing && (
                    <View style={styles.editButtons}>
                      <TouchableOpacity 
                        style={[styles.editButton, styles.cancelButton]}
                        onPress={() => {
                          setIsEditing(false);
                          setEditedNickname(profile.nickname);
                        }}
                      >
                        <Text style={styles.editButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.editButton, styles.saveButton]}
                        onPress={handleUpdateProfile}
                      >
                        <Text style={styles.editButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subscription</Text>
                <View style={styles.subscriptionCard}>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionType}>
                      {profile.subscription_type === 'premium' ? 'Premium' : 'Free'}
                    </Text>
                    <Text style={styles.subscriptionDescription}>
                      {profile.subscription_type === 'premium' 
                        ? 'Unlimited access to all features' 
                        : 'Basic access with limited features'}
                    </Text>
                  </View>
                  
                  {profile.subscription_type !== 'premium' && (
                    <TouchableOpacity style={styles.upgradeButton}>
                      <Text style={styles.upgradeButtonText}>Upgrade</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <TouchableOpacity 
                  style={styles.preferenceItem}
                  onPress={() => handleOpenPreference('duration')}
                >
                  <View>
                    <Text style={styles.preferenceLabel}>Default Session Duration</Text>
                    <Text style={styles.preferenceValue}>{profile.default_duration} minutes</Text>
                  </View>
                  <ChevronRight size={20} color="#666" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.preferenceItem}
                  onPress={() => handleOpenPreference('voice')}
                >
                  <View>
                    <Text style={styles.preferenceLabel}>Preferred Voice</Text>
                    <Text style={styles.preferenceValue}>{profile.preferred_voice}</Text>
                  </View>
                  <ChevronRight size={20} color="#666" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.preferenceItem}
                  onPress={() => handleOpenPreference('background')}
                >
                  <View>
                    <Text style={styles.preferenceLabel}>Preferred Background</Text>
                    <Text style={styles.preferenceValue}>{profile.preferred_background}</Text>
                  </View>
                  <ChevronRight size={20} color="#666" />
                </TouchableOpacity>
                
                <View style={styles.preferenceItem}>
                  <View>
                    <Text style={styles.preferenceLabel}>Notifications</Text>
                    <Text style={styles.preferenceValue}>
                      {profile.notifications ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={profile.notifications}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: '#333', true: '#6366f1' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut size={24} color="#ef4444" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyProfileContainer}>
              <Text style={styles.emptyProfileText}>
                Sign in to view and manage your profile
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <LoginOverlay 
        visible={!isAuthenticated} 
        message="Please log in to view and edit your profile settings."
        onLogin={() => setIsAuthenticated(true)}
      />
      
      <Modal
        visible={showPreferenceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreferenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.preferenceModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentPreference === 'duration' && 'Session Duration'}
                {currentPreference === 'voice' && 'Preferred Voice'}
                {currentPreference === 'background' && 'Background Sound'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPreferenceModal(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.preferenceOptions}>
              {renderPreferenceOptions()}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPreferenceModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdatePreference}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#666',
    fontSize: 14,
  },
  nameInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subscriptionDescription: {
    color: '#666',
    fontSize: 14,
  },
  upgradeButton: {
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  preferenceLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  preferenceValue: {
    color: '#666',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  preferenceModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  preferenceOptions: {
    marginBottom: 20,
  },
  preferenceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#262626',
  },
  preferenceOptionSelected: {
    backgroundColor: '#6366f1',
  },
  preferenceOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  preferenceOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProfileText: {
    color: '#fff',
    textAlign: 'center',
  },
});
