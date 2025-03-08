import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Music2, Users, Play, Pause, CreditCard as Edit, Trash2, Upload, Check, ChevronDown, Volume2, X, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React from 'react';
import LoginOverlay from '@/components/LoginOverlay';

interface Track {
  id: string;
  name: string;
  category: string;
  url: string;
  created_at: string;
  category_id: string;
  user_id: string;
  is_public: boolean;
  is_built_in: boolean;
  duration: number;
}

interface Mix {
  id: string;
  name: string;
  duration: number;
  is_public: boolean;
  created_at: string;
  user_id: string;
}

interface AudioRef {
  element?: HTMLAudioElement;
  sound?: Audio.Sound;
  progress?: number;
}

interface AudioFile {
  name: string;
  uri?: string;
  type?: string;
  size?: number;
}

interface UploadDetails {
  name: string;
  category: string;
  file: AudioFile | File | null;
}

function isAudioFile(file: AudioFile | File): file is AudioFile {
  return 'uri' in file;
}

// Define category types
type StringCategory = string;
type ObjectCategory = { id: string; label: string };
type Category = StringCategory | ObjectCategory;

// Define category constants
const BUILT_IN_CATEGORIES = ['all', 'nature', 'music', 'meditation', 'voice', 'binaural'];
const MY_LIBRARY_CATEGORIES = ['all', 'uploads', 'mixes', 'favorites'];
const COMMUNITY_CATEGORIES = ['all', 'popular', 'recent', 'featured'];

const TABS = [
  { id: 'built-in', label: 'Built-in Sounds', icon: Music2 },
  { id: 'my-library', label: 'My Library', icon: Music2 },
  { id: 'community', label: 'Community', icon: Users },
];

export default function LibraryScreen() {
  const { selectMode, trackId } = useLocalSearchParams<{ selectMode: string; trackId: string }>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [activeTab, setActiveTab] = useState('built-in');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showMyMixes, setShowMyMixes] = useState(false);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [isLoadingMixes, setIsLoadingMixes] = useState(false);
  const [playingProgress, setPlayingProgress] = useState<{ [key: string]: number }>({});
  const audioRef = useRef<AudioRef>({});
  const progressInterval = useRef<NodeJS.Timeout>();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDetails, setUploadDetails] = useState<UploadDetails>({
    name: '',
    category: '',
    file: null
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      }).catch(console.error);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (Platform.OS === 'web' && audioRef.current?.element) {
        audioRef.current.element.pause();
        audioRef.current.element.src = '';
      } else if (audioRef.current?.sound) {
        audioRef.current.sound.unloadAsync();
      }
      audioRef.current = {};
    };
  }, []);

  useEffect(() => {
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        if (session) {
          fetchMixes();
          fetchTracks();
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
        fetchMixes();
        fetchTracks();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  }

  useEffect(() => {
    fetchTracks();
  }, [activeTab, activeCategory]);

  useEffect(() => {
    if (activeTab === 'my-library' && showMyMixes) {
      fetchMixes();
    }
  }, [activeTab, showMyMixes]);

  async function fetchMixes() {
    try {
      setIsLoadingMixes(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // First try to fetch from mixes_v2 table
      const { data: v2Data, error: v2Error } = await supabase
        .from('mixes_v2')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!v2Error && v2Data && v2Data.length > 0) {
        console.log('Fetched mixes from mixes_v2 table:', v2Data.length);
        setMixes(v2Data);
        return;
      }

      // Fall back to old mixes table if no data in mixes_v2
      console.log('No mixes found in mixes_v2 table, falling back to old table');
      const { data, error } = await supabase
        .from('mixes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMixes(data || []);
    } catch (err) {
      console.error('Error fetching mixes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load mixes');
    } finally {
      setIsLoadingMixes(false);
    }
  }

  async function fetchTracks() {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching tracks for tab: ${activeTab}, category: ${activeCategory}`);

      let query = supabase.from('audio_tracks').select('*');

      // Base query based on active tab
      if (activeTab === 'built-in') {
        query = query.eq('is_built_in', true);
        
        // Apply built-in category filters
        if (activeCategory !== 'all') {
          query = query.eq('category', activeCategory.toLowerCase());
        }
      } else if (activeTab === 'my-library') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (activeCategory === 'mixes') {
            // Fetch only mixes
            return fetchMixes();
          } else if (activeCategory === 'uploads') {
            // Fetch only user uploads
            query = query.eq('user_id', user.id).eq('is_built_in', false);
          } else {
            // Fetch both mixes and uploads
            const [tracks, mixes] = await Promise.all([
              query.eq('user_id', user.id).eq('is_built_in', false),
              fetchMixes()
            ]);
            // Combine tracks and mixes
            return;
          }
        }
      } else if (activeTab === 'community') {
        query = query.eq('is_public', true).eq('is_built_in', false);
        
        if (activeCategory !== 'all') {
          query = query.eq('category', activeCategory.toLowerCase());
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tracks:', error);
        throw error;
      }

      console.log(`Fetched ${data ? data.length : 0} tracks`);
      
      // Log sample data for debugging
      if (data && data.length > 0) {
        console.log('Sample track data:', data.slice(0, 2));
      } else {
        console.log('No tracks found with the current filters');
      }
      
      setTracks(data || []);
    } catch (err) {
      console.error('Error in fetchTracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
      
      // Show alert for better visibility on mobile
      alert(`Error loading tracks: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUploadClick() {
    try {
      let file: AudioFile | File;
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        
        const promise = new Promise<File>((resolve) => {
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
              resolve(target.files[0]);
            }
          };
        });
        
        input.click();
        file = await promise;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'audio/*',
          copyToCacheDirectory: true
        });

        if (result.canceled) {
          return;
        }

        file = {
          name: result.assets[0].name,
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          size: result.assets[0].size
        };
      }

      setUploadDetails({
        name: file.name.split('.')[0], // Default name from file
        category: activeCategory === 'all' ? 'music' : activeCategory,
        file
      });
      setShowUploadModal(true);
    } catch (err) {
      console.error('Error selecting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to select file');
    }
  }

  async function handleUpload() {
    try {
      if (!uploadDetails.file) {
        throw new Error('No file selected');
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Please sign in to upload tracks');
      }

      setIsLoading(true);
      setError(null);

      const fileExt = uploadDetails.file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      let fileData: Blob | File;
      if (Platform.OS === 'web') {
        fileData = uploadDetails.file as File;
      } else if (isAudioFile(uploadDetails.file) && uploadDetails.file.uri) {
        const base64 = await FileSystem.readAsStringAsync(uploadDetails.file.uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        fileData = new Blob([ab], { type: `audio/${fileExt}` });
      } else {
        throw new Error('Invalid file format');
      }

      const { error: uploadError, data } = await supabase.storage
        .from('audio-files')  // Changed from 'audio' to 'audio-files'
        .upload(filePath, fileData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')  // Changed from 'audio' to 'audio-files'
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('audio_tracks')
        .insert({
          name: uploadDetails.name,
          url: publicUrl,
          category: uploadDetails.category.toLowerCase(),
          user_id: user.id,
          is_public: false,
          is_built_in: false,
        });

      if (dbError) throw dbError;

      setShowUploadModal(false);
      setUploadDetails({ name: '', category: '', file: null });
      fetchTracks();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  }

  async function playSound(track: Track) {
    try {
      setIsLoading(true);

      // Stop currently playing track
      if (Platform.OS === 'web' && audioRef.current?.element) {
        audioRef.current.element.pause();
        audioRef.current.element.src = '';
      } else if (audioRef.current?.sound) {
        await audioRef.current.sound.unloadAsync();
      }
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      if (playingTrackId === track.id) {
        setPlayingTrackId(null);
        setPlayingProgress(prev => ({ ...prev, [track.id]: 0 }));
        return;
      }

      if (Platform.OS === 'web') {
        const audioElement = new window.Audio(track.url);
        audioElement.loop = true;
        await audioElement.play();
        audioRef.current = { element: audioElement };

        progressInterval.current = setInterval(() => {
          if (audioElement.duration) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            setPlayingProgress(prev => ({ ...prev, [track.id]: progress }));
          }
        }, 100);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.url },
          { 
            shouldPlay: true,
            isLooping: true,
            progressUpdateIntervalMillis: 100,
          },
          (status) => {
            if (status.isLoaded && status.durationMillis) {
              const progress = (status.positionMillis / status.durationMillis) * 100;
              setPlayingProgress(prev => ({ ...prev, [track.id]: progress }));
            }
          }
        );

        audioRef.current = { sound };
        await sound.playAsync();
      }

      setPlayingTrackId(track.id);
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayingTrackId(null);
      setPlayingProgress(prev => ({ ...prev, [track.id]: 0 }));
    } finally {
      setIsLoading(false);
    }
  }

  const handleTrackSelect = (track: Track) => {
    if (selectMode === 'true' && trackId) {
      setSelectedTrack(track);
      setShowConfirmModal(true);
    } else {
      playSound(track);
    }
  };

  const handleConfirmTrackSelection = () => {
    if (selectedTrack && trackId) {
      router.push({
        pathname: '/(tabs)/mixer2',
        params: {
          selectedTrackId: selectedTrack.id,
          selectedTrackName: selectedTrack.name,
          selectedTrackUrl: selectedTrack.url,
          mixerTrackId: trackId,
          from: '/(tabs)/library'
        }
      });
    }
  };

  const handleMixPress = async (mixId: string) => {
    try {
      console.log('Loading mix:', mixId);
      
      // First try to fetch from mixes_v2 table
      const { data: mixV2, error: mixV2Error } = await supabase
        .from('mixes_v2')
        .select('*')
        .eq('id', mixId)
        .single();
        
      if (!mixV2Error && mixV2) {
        console.log('Mix details from mixes_v2:', mixV2);
        
        // Navigate to mixer2 with mix ID and basic info
        router.push({
          pathname: '/(tabs)/mixer2',
          params: {
            mixId,
            mixName: mixV2.name,
            mixDuration: mixV2.duration,
            mixIsPublic: mixV2.is_public,
            from: '/(tabs)/library'
          }
        });
        return;
      }
      
      // Fall back to old mixes table if not found in mixes_v2
      console.log('Mix not found in mixes_v2, falling back to old table');
      const { data: mix, error: mixError } = await supabase
        .from('mixes')
        .select('*')
        .eq('id', mixId)
        .single();

      if (mixError) throw mixError;
      console.log('Mix details from old table:', mix);

      // Navigate to mixer2 with mix ID and basic info
      router.push({
        pathname: '/(tabs)/mixer2',
        params: {
          mixId,
          mixName: mix.name,
          mixDuration: mix.duration,
          mixIsPublic: mix.is_public,
          from: '/(tabs)/library'
        }
      });
    } catch (err) {
      console.error('Error loading mix:', err);
      setError(err instanceof Error ? err.message : 'Failed to load mix');
    }
  };

  const renderTrack = ({ item }: { item: Track }) => {
    const isPlaying = playingTrackId === item.id;
    const progress = playingProgress[item.id] || 0;

    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => handleTrackSelect(item)}
      >
        <View style={styles.itemInfo}>
          <View style={[styles.itemIcon, isPlaying && styles.itemIconPlaying]}>
            <Music2 size={20} color={isPlaying ? '#6366f1' : '#fff'} />
          </View>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            {isPlaying && (
              <Text style={styles.playingText}>Now Playing</Text>
            )}
          </View>
        </View>

        <View style={styles.itemMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          {!selectMode && (
            <View style={styles.itemActions}>
              <TouchableOpacity 
                style={[styles.actionButton, isPlaying && styles.actionButtonActive]}
                onPress={() => playSound(item)}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Pause size={16} color="#fff" />
                ) : (
                  <Play size={16} color="#6366f1" />
                )}
              </TouchableOpacity>
              
              {!item.is_built_in && (
                <>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditTrack(item)}
                  >
                    <Edit size={16} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteTrack(item)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {isPlaying && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMix = ({ item }: { item: Mix }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => handleMixPress(item.id)}
    >
      <View style={styles.itemInfo}>
        <View style={styles.itemIcon}>
          <Volume2 size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSubtext}>{item.duration} minutes</Text>
        </View>
      </View>
      
      <View style={styles.itemMeta}>
        {item.is_public && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Public</Text>
          </View>
        )}
        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleMixPress(item.id)}
          >
            <Volume2 size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditMix(item)}
          >
            <Edit size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteMix(item)}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleEditTrack = (track: Track) => {
    console.log('Edit track:', track.id);
  };

  const handleDeleteTrack = async (track: Track) => {
    try {
      if (!window.confirm('Are you sure you want to delete this track?')) {
        return;
      }

      setIsLoading(true);
      
      // Delete from storage
      const fileName = track.url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('audio-files')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('audio_tracks')
        .delete()
        .eq('id', track.id);

      if (error) throw error;

      // Refresh tracks list
      fetchTracks();
    } catch (err) {
      console.error('Error deleting track:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete track');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMix = (mix: Mix) => {
    router.push({
      pathname: '/(tabs)/mixer2',
      params: {
        mixId: mix.id,
        mixName: mix.name,
        mixDuration: mix.duration.toString(),
        mixIsPublic: mix.is_public.toString(),
        from: '/(tabs)/library'
      }
    });
  };

  const handleDeleteMix = async (mix: Mix) => {
    try {
      if (!window.confirm('Are you sure you want to delete this mix?')) {
        return;
      }

      setIsLoading(true);

      // Try to delete from mixes_v2 first
      try {
        const { error: v2Error } = await supabase
          .from('mixes_v2')
          .delete()
          .eq('id', mix.id);
          
        if (v2Error) {
          console.error('Error deleting from mixes_v2:', v2Error);
          // Continue with old table deletion even if this fails
        } else {
          console.log('Successfully deleted mix from mixes_v2 table');
        }
      } catch (v2Error) {
        console.error('Error deleting from mixes_v2:', v2Error);
        // Continue with old table deletion even if this fails
      }

      // Delete from old mixes table
      const { error } = await supabase
        .from('mixes')
        .delete()
        .eq('id', mix.id);

      if (error) throw error;

      // Delete mix tracks from mix_tracks table
      const { error: tracksError } = await supabase
        .from('mix_tracks')
        .delete()
        .eq('mix_id', mix.id);
        
      if (tracksError) {
        console.error('Error deleting mix tracks:', tracksError);
        // Continue even if this fails
      }

      // Refresh mixes list
      fetchMixes();
    } catch (err) {
      console.error('Error deleting mix:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete mix');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the current categories based on active tab
  const getCurrentCategories = (): string[] => {
    switch (activeTab) {
      case 'built-in':
        return BUILT_IN_CATEGORIES;
      case 'my-library':
        return MY_LIBRARY_CATEGORIES;
      case 'community':
        return COMMUNITY_CATEGORIES;
      default:
        return BUILT_IN_CATEGORIES;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (activeCategory === 'mixes' || (activeTab === 'my-library' && activeCategory === 'all')) {
      return (
        <FlatList
          data={mixes}
          renderItem={renderMix}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No mixes found</Text>
          }
        />
      );
    }

    return (
      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tracks found</Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Library</Text>
        
        <View style={{gap: 0, marginBottom: 0}}>
          {/* Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
          >
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  activeTab === tab.id && styles.activeTabButton
                ]}
                onPress={() => {
                  setActiveTab(tab.id);
                  setActiveCategory('all');
                }}
              >
                <tab.icon size={18} color={activeTab === tab.id ? '#fff' : '#666'} />
                <Text style={[
                  styles.tabButtonText,
                  activeTab === tab.id && styles.activeTabButtonText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {getCurrentCategories().map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  activeCategory === category && styles.activeCategoryButton
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  activeCategory === category && styles.activeCategoryButtonText
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        
        {/* View mode toggle */}
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && styles.activeViewModeButton
              ]}
              onPress={() => setViewMode('list')}
            >
              <Text style={styles.viewModeButtonText}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'grid' && styles.activeViewModeButton
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={styles.viewModeButtonText}>Grid</Text>
            </TouchableOpacity>
          </View>
        
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </View>
      
      <LoginOverlay 
        visible={isAuthenticated === false} 
        message="Please log in to access your sound library and saved mixes."
        onLogin={() => setIsAuthenticated(true)}
      />
      
      {/* Upload button */}
      {activeTab === 'my-library' && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadClick}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
      
      {/* Upload modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <Text style={styles.modalTitle}>Upload Audio Track</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Track Name</Text>
              <TextInput
                style={styles.input}
                value={uploadDetails.name}
                onChangeText={(text) => setUploadDetails(prev => ({ ...prev, name: text }))}
                placeholder="Enter track name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryPicker}
              >
                {getCurrentCategories().map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      uploadDetails.category === category && styles.categoryOptionSelected
                    ]}
                    onPress={() => setUploadDetails(prev => ({ ...prev, category: category }))}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      uploadDetails.category === category && styles.categoryOptionTextSelected
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowUploadModal(false);
                  setUploadDetails({ name: '', category: '', file: null });
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.uploadModalButton,
                  (!uploadDetails.name || !uploadDetails.category) && styles.modalButtonDisabled
                ]}
                onPress={handleUpload}
                disabled={!uploadDetails.name || !uploadDetails.category}
              >
                <Text style={styles.modalButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Confirm delete modal */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Add Track to Mix</Text>
            <Text style={styles.confirmText}>
              Do you want to add "{selectedTrack?.name}" to Track {parseInt(trackId || '0') + 1}?
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonConfirm]}
                onPress={handleConfirmTrackSelection}
              >
                <Check size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Add Track</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginRight: 6,
    gap: 4,
    maxHeight: 30,
  },
  activeTabButton: {
    backgroundColor: '#6366f1',
  },
  tabButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 4,
  },
  categoryButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginRight: 6,
    maxHeight: 28,
  },
  activeCategoryButton: {
    backgroundColor: '#6366f1',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  viewModeContainer: {
    display: 'none',
  },
  viewModeButton: {
    display: 'none',
  },
  activeViewModeButton: {
    display: 'none',
  },
  viewModeButtonText: {
    display: 'none',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#262626',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  categoryPicker: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#262626',
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#6366f1',
  },
  categoryOptionText: {
    color: '#666',
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#262626',
  },
  uploadModalButton: {
    backgroundColor: '#6366f1',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconPlaying: {
    backgroundColor: '#818cf8',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#818cf8',
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  playingText: {
    color: '#6366f1',
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#262626',
    marginTop: 8,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  confirmModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonCancel: {
    backgroundColor: '#262626',
  },
  confirmButtonConfirm: {
    backgroundColor: '#6366f1',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 20,
  },
});
