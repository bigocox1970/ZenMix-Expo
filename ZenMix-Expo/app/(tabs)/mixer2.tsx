import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { Plus, Play, Pause, Volume2, Trash2, X, Search, Settings } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { supabase } from '../../lib/supabase';
import { useLocalSearchParams } from 'expo-router';

// Add WebAudio interface
interface WebAudio {
  audio: HTMLAudioElement;
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  unload: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
}

// Update Track interface
interface Track {
  id: string;
  name: string;
  volume: number;
  isPlaying: boolean;
  loopTime: number;
  progress: number;
  url?: string;
  sound?: Audio.Sound | WebAudio;
  audioTrackId?: string;
}

// Sound interface
interface Sound {
  id: string;
  name: string;
  category: string;
  url: string;
}

interface CategoryResponse {
  id: string;
  name: string;
}

interface SoundResponse {
  id: string;
  name: string;
  url: string;
  category_id: string;
  categories: {
    name: string;
  }[];
}

// Add new interfaces for settings
interface TrackSettings {
  loopTime: number;
  volume: number;
  isLongDuration: boolean;
}

interface MasterSettings {
  duration: number;
  volume: number;
  isLongDuration: boolean;
}

// Add VolumeControl component
const VolumeControl = React.memo(({ 
  track, 
  onVolumeChange 
}: { 
  track: Track; 
  onVolumeChange: (value: number) => void;
}) => {
  return (
    <View style={styles.volumeControl}>
      <Text style={styles.volumeTrackName}>{track.name}</Text>
      <View style={styles.volumeSliderContainer}>
        <Volume2 size={20} color="#fff" />
        <Slider
          minimumValue={0}
          maximumValue={1}
          value={track.volume}
          onValueChange={onVolumeChange}
          minimumTrackTintColor="#6366f1"
          maximumTrackTintColor="#333"
          thumbTintColor="#fff"
          style={{ flex: 1, height: 40 }}
        />
        <Text style={styles.volumeValue}>
          {Math.round(track.volume * 100)}%
        </Text>
      </View>
    </View>
  );
});

// Create web audio handler
const createWebAudio = (url: string, volume: number): WebAudio => {
  const audio = new window.Audio(url);
  audio.loop = true;
  audio.volume = volume;

  return {
    audio,
    play: async () => {
      try {
        await audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    },
    pause: () => audio.pause(),
    setVolume: (vol: number) => {
      audio.volume = vol;
    },
    unload: () => {
      audio.pause();
      audio.src = '';
      audio.remove();
    },
    getDuration: () => audio.duration,
    getCurrentTime: () => audio.currentTime,
    seekTo: (time: number) => {
      audio.currentTime = time;
    }
  };
};

export default function MixerScreen2() {
  // Get route params
  const params = useLocalSearchParams<{
    mixId: string;
    mixName: string;
    mixDuration: string;
    mixIsPublic: string;
  }>();

  // Initialize with 4 empty tracks
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track-0', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
    { id: 'track-1', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
    { id: 'track-2', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
    { id: 'track-3', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
  ]);

  // Volume control modal state
  const [isVolumeModalVisible, setIsVolumeModalVisible] = useState(false);
  const [selectedTrackForVolume, setSelectedTrackForVolume] = useState<number | null>(null);

  // Sound picker modal state
  const [isSoundPickerVisible, setIsSoundPickerVisible] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add refs for modals
  const volumeModalRef = useRef(null);
  const soundPickerModalRef = useRef(null);

  // Add master volume state
  const [masterVolume, setMasterVolume] = useState(1);
  const [isAllPlaying, setIsAllPlaying] = useState(false);

  // Add mix duration state
  const [mixDuration, setMixDuration] = useState(300); // Default 5 minutes
  const [mixProgress, setMixProgress] = useState(0);
  const mixStartTimeRef = useRef<number | null>(null);

  // Add settings state
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [selectedTrackForSettings, setSelectedTrackForSettings] = useState<string | null>(null);
  const [masterSettings, setMasterSettings] = useState<MasterSettings>({ 
    duration: 300,
    volume: 1,
    isLongDuration: false
  });

  // Add new state for save mix modal
  const [isSaveMixModalVisible, setIsSaveMixModalVisible] = useState(false);
  const [mixName, setMixName] = useState('');

  // Add handlers for clear all and save mix
  const handleClearAll = async () => {
    // Stop all playing tracks first
    if (isAllPlaying) {
      await handlePlayPauseAll();
    }
    
    // Unload all sounds
    await Promise.all(tracks.map(async track => {
      if (track.sound) {
        if (Platform.OS === 'web') {
          (track.sound as WebAudio).unload();
        } else {
          await (track.sound as Audio.Sound).unloadAsync();
        }
      }
    }));

    // Reset tracks to initial state
    setTracks([
      { id: 'track-0', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
      { id: 'track-1', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
      { id: 'track-2', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
      { id: 'track-3', name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
    ]);
    setMixProgress(0);
    mixStartTimeRef.current = null;
  };

  const handleSaveMix = async () => {
    try {
      const activeTracks = tracks.filter(track => track.name && track.url && track.audioTrackId);
      if (activeTracks.length === 0) {
        console.error('No tracks to save');
        return;
      }

      if (!mixName.trim()) {
        console.error('Mix name is required');
        return;
      }

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Prepare sanitized tracks data for JSON storage
      const sanitizedTracks = activeTracks.map(track => {
        // Ensure all text values are properly sanitized
        const name = typeof track.name === 'string' ? track.name : String(track.name || '');
        const url = typeof track.url === 'string' ? track.url : String(track.url || '');
        const id = track.audioTrackId || '';
        
        return {
          id: track.id,
          name,
          url,
          audioTrackId: id,
          volume: track.volume,
          loopTime: track.loopTime
        };
      });

      // Insert into mixes_v2 table with tracks as JSON
      // Ensure duration is an integer to avoid database errors
      const durationInt = Math.round(mixDuration);
      
      const { data: mix, error: mixError } = await supabase
        .from('mixes_v2')
        .insert({
          name: mixName.trim(),
          duration: durationInt,
          is_public: false,
          user_id: user.id,
          tracks: sanitizedTracks
        })
        .select()
        .single();

      if (mixError) throw mixError;

      console.log('Mix saved successfully to mixes_v2 table');
      setIsSaveMixModalVisible(false);
      setMixName('');
    } catch (error) {
      console.error('Error saving mix:', error);
    }
  };

  // Add function to load mix from mixes_v2 table
  const loadMixFromV2 = async (mixId: string) => {
    try {
      console.log(`Loading mix from mixes_v2 table: ${mixId}`);
      
      // Fetch mix data from mixes_v2 table
      const { data: mixData, error: mixError } = await supabase
        .from('mixes_v2')
        .select('*')
        .eq('id', mixId)
        .single();
        
      if (mixError) {
        console.error('Error fetching mix data:', mixError);
        throw mixError;
      }
      
      if (!mixData) {
        console.error('No mix data found');
        return;
      }
      
      console.log('Mix data loaded:', mixData);
      
      // Set mix settings
      setMixName(mixData.name);
      setMixDuration(mixData.duration);
      
      // Parse tracks from JSON
      const mixTracks = mixData.tracks;
      
      if (Array.isArray(mixTracks) && mixTracks.length > 0) {
        // Create new tracks array with sanitized data
        const newTracks: Track[] = [...tracks]; // Create a copy of the tracks array
        
        // Update tracks with mix data
        mixTracks.forEach((mixTrack, idx) => {
          if (idx < newTracks.length) {
            // Ensure all text values are properly sanitized
            const name = typeof mixTrack.name === 'string' ? mixTrack.name : String(mixTrack.name || '');
            const url = typeof mixTrack.url === 'string' ? mixTrack.url : String(mixTrack.url || '');
            const audioTrackId = mixTrack.audioTrackId || '';
            
            console.log(`Adding track ${idx + 1}:`, name);
            
            newTracks[idx] = {
              id: newTracks[idx].id,
              name,
              volume: mixTrack.volume || 1,
              isPlaying: false,
              loopTime: mixTrack.loopTime || 30,
              progress: 0,
              url,
              audioTrackId
            };
          }
        });
        
        console.log('Final tracks array:', newTracks);
        setTracks(newTracks);
      }
    } catch (error) {
      console.error('Error loading mix from mixes_v2:', error);
    }
  };

  // Add useEffect to load mix data from route params
  useEffect(() => {
    const loadMixData = async () => {
      // Check if we have mix data in route params
      if (params.mixId) {
        console.log('Mixer params:', params);
        
        // Try to load from mixes_v2 first
        try {
          await loadMixFromV2(params.mixId);
          
          // Set mix name and duration from params if available
          if (params.mixName) {
            setMixName(params.mixName);
          }
          
          if (params.mixDuration) {
            const duration = parseInt(params.mixDuration, 10);
            if (!isNaN(duration)) {
              setMixDuration(duration);
            }
          }
        } catch (error) {
          console.error('Error loading from mixes_v2:', error);
        }
      } else if (Platform.OS === 'web') {
        // Fallback to URL params for web platform
        const urlParams = new URLSearchParams(window.location.search);
        const mixId = urlParams.get('mixId');
        
        if (mixId) {
          try {
            await loadMixFromV2(mixId);
          } catch (error) {
            console.error('Error loading from mixes_v2 (URL params):', error);
          }
        }
      }
    };
    
    loadMixData();
    
    // Set up audio mode
    const setupAudio = async () => {
      console.log('Setting up audio mode...');
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('Audio mode set successfully.');
      } catch (err) {
        console.error('Failed to set audio mode:', err);
      }
    };
    
    setupAudio();
  }, [params.mixId, params.mixName, params.mixDuration]);

  // Update useEffect for progress tracking to ensure it updates correctly
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isAllPlaying) {
      // Set start time when playback begins
      if (mixStartTimeRef.current === null) {
        mixStartTimeRef.current = Date.now();
      }

      progressInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - (mixStartTimeRef.current || currentTime)) / 1000;
        
        // Calculate progress based on mix duration (in seconds)
        // If mixDuration is already in seconds, don't multiply by 60
        const durationInSeconds = mixDuration;
        const newProgress = Math.min(elapsedTime / durationInSeconds, 1);
        
        setMixProgress(newProgress);
        console.log(`Mix progress: ${newProgress.toFixed(3)} (${Math.floor(elapsedTime)}s / ${durationInSeconds}s)`);

        // Update individual track progress
        setTracks(prevTracks => {
          return prevTracks.map(track => {
            if (track.sound && track.isPlaying) {
              let currentTime = 0;
              let duration = track.loopTime;

              if (Platform.OS === 'web') {
                const webAudio = track.sound as WebAudio;
                currentTime = webAudio.getCurrentTime();
                duration = webAudio.getDuration() || track.loopTime;
              }

              return {
                ...track,
                progress: currentTime / duration
              };
            }
            return track;
          });
        });

        // Stop all tracks when mix duration is reached
        if (newProgress >= 1) {
          handlePlayPauseAll();
          mixStartTimeRef.current = null;
        }
      }, 100);
    } else {
      // Reset start time when stopped
      mixStartTimeRef.current = null;
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isAllPlaying, mixDuration]);

  // Handle play/pause
  const handlePlayPause = async (trackId: string) => {
    try {
      const trackIndex = tracks.findIndex(t => t.id === trackId);
      if (trackIndex === -1) return;

      const track = tracks[trackIndex];
      
      // If no sound is loaded yet
      if (!track.sound && track.url) {
        if (Platform.OS === 'web') {
          // Web implementation
          const webAudio = createWebAudio(track.url, track.volume);
          await webAudio.play();
          
          setTracks(prev => prev.map((t, i) => 
            i === trackIndex 
              ? { ...t, sound: webAudio, isPlaying: true }
              : t
          ));
        } else {
          // Native implementation
          const { sound } = await Audio.Sound.createAsync(
            { uri: track.url },
            { 
              isLooping: true,
              volume: track.volume,
              shouldPlay: true 
            }
          );
          
          setTracks(prev => prev.map((t, i) => 
            i === trackIndex 
              ? { ...t, sound, isPlaying: true }
              : t
          ));
        }
      } else if (track.sound) {
        // Toggle play/pause for existing sound
        if (track.isPlaying) {
          if (Platform.OS === 'web') {
            (track.sound as WebAudio).pause();
          } else {
            await (track.sound as Audio.Sound).pauseAsync();
          }
        } else {
          if (Platform.OS === 'web') {
            await (track.sound as WebAudio).play();
          } else {
            await (track.sound as Audio.Sound).playAsync();
          }
        }
        
        setTracks(prev => prev.map(t => 
          t.id === trackId ? { ...t, isPlaying: !t.isPlaying } : t
        ));
      }
    } catch (error) {
      console.error('Error handling play/pause:', error);
    }
  };

  // Update volume change handler
  const handleVolumeChange = async (trackId: string, value: number): Promise<void> => {
    try {
      const track = tracks.find(t => t.id === trackId);
      if (track?.sound) {
        if (Platform.OS === 'web') {
          (track.sound as WebAudio).setVolume(value);
        } else {
          await (track.sound as Audio.Sound).setVolumeAsync(value);
        }
      }
      
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, volume: value } : t
      ));
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  // Update remove track handler
  const handleRemoveTrack = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track?.sound) {
      try {
        if (Platform.OS === 'web') {
          (track.sound as WebAudio).unload();
        } else {
          await (track.sound as Audio.Sound).unloadAsync();
        }
      } catch (error) {
        console.error('Error unloading sound:', error);
      }
    }
    
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, name: '', url: undefined, sound: undefined, isPlaying: false } : t
    ));
  };

  // Handle adding a sound to a track
  const handleAddSound = (index: number) => {
    setSelectedTrackIndex(index);
    setIsSoundPickerVisible(true);
    fetchSoundsAndCategories();
  };

  // Handle selecting a sound
  const handleSelectSound = (sound: Sound) => {
    if (selectedTrackIndex !== null) {
      // Ensure all values are properly sanitized
      const name = typeof sound.name === 'string' ? sound.name : String(sound.name || '');
      const url = typeof sound.url === 'string' ? sound.url : String(sound.url || '');
      const id = sound.id;
      
      setTracks(prev => prev.map((t, index) => 
        index === selectedTrackIndex 
          ? { ...t, name, url, audioTrackId: id, isPlaying: false }
          : t
      ));
      setIsSoundPickerVisible(false);
      setSelectedTrackIndex(null);
      setSearchQuery('');
    }
  };

  // Fetch sounds and categories from database
  const fetchSoundsAndCategories = async () => {
    try {
      setIsLoading(true);
      
      // Fetch audio tracks
      const { data: audioData, error: audioError } = await supabase
        .from('audio_tracks')
        .select('*')
        .order('name');
        
      if (audioError) throw audioError;
      
      if (Array.isArray(audioData)) {
        // Ensure all text values are strings and sanitized
        const formattedSounds = audioData.map(sound => {
          // Ensure name is a string
          const name = typeof sound.name === 'string' ? sound.name : String(sound.name || '');
          
          // Ensure category is a string
          const category = typeof sound.category === 'string' ? 
            sound.category : 
            String(sound.category || 'music');
          
          // Ensure URL is a string
          const url = typeof sound.url === 'string' ? sound.url : String(sound.url || '');
          
          return {
            id: sound.id,
            name,
            url,
            category
          };
        });
        
        // Extract unique categories
        const uniqueCategories = [...new Set(formattedSounds.map(sound => sound.category))];
        setCategories(['All', ...uniqueCategories]);
        setSounds(formattedSounds);
        
        console.log('Loaded sounds:', formattedSounds.length);
      }
    } catch (error) {
      console.error('Error fetching sounds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter sounds based on category and search query
  const filteredSounds = sounds.filter(sound => {
    const matchesCategory = selectedCategory === 'All' || sound.category === selectedCategory;
    const matchesSearch = sound.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add master volume handler
  const handleMasterVolumeChange = async (value: number) => {
    try {
      // Update all track volumes
      tracks.forEach(track => {
        if (track.sound) {
          if (Platform.OS === 'web') {
            (track.sound as WebAudio).setVolume(track.volume * value);
          } else {
            (track.sound as Audio.Sound).setVolumeAsync(track.volume * value);
          }
        }
      });
      setMasterVolume(value);
    } catch (error) {
      console.error('Error changing master volume:', error);
    }
  };

  // Update handlePlayPauseAll
  const handlePlayPauseAll = async () => {
    try {
      if (!isAllPlaying) {
        // Reset mix progress when starting
        setMixProgress(0);
        mixStartTimeRef.current = Date.now();

        // Start all tracks from the beginning
        const updatedTracks = await Promise.all(
          tracks.map(async track => {
            if (track.url && !track.sound) {
              if (Platform.OS === 'web') {
                const webAudio = createWebAudio(track.url, track.volume * masterVolume);
                await webAudio.play();
                return { ...track, sound: webAudio, isPlaying: true, progress: 0 };
              } else {
                const { sound } = await Audio.Sound.createAsync(
                  { uri: track.url },
                  { 
                    isLooping: true,
                    volume: track.volume * masterVolume,
                    shouldPlay: true 
                  }
                );
                return { ...track, sound, isPlaying: true, progress: 0 };
              }
            } else if (track.sound) {
              if (Platform.OS === 'web') {
                const webAudio = track.sound as WebAudio;
                webAudio.seekTo(0);
                await webAudio.play();
              } else {
                await (track.sound as Audio.Sound).setPositionAsync(0);
                await (track.sound as Audio.Sound).playAsync();
              }
              return { ...track, isPlaying: true, progress: 0 };
            }
            return track;
          })
        );
        setTracks(updatedTracks);
        setIsAllPlaying(true);
      } else {
        // Pause all tracks
        const updatedTracks = await Promise.all(
          tracks.map(async track => {
            if (track.sound) {
              if (Platform.OS === 'web') {
                (track.sound as WebAudio).pause();
              } else {
                await (track.sound as Audio.Sound).pauseAsync();
              }
              return { ...track, isPlaying: false };
            }
            return track;
          })
        );
        setTracks(updatedTracks);
        setIsAllPlaying(false);
      }
    } catch (error) {
      console.error('Error handling play/pause all:', error);
    }
  };

  // Add progress bar component
  const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
    </View>
  );

  // Add settings handlers
  const handleOpenSettings = (trackId: string | null) => {
    setSelectedTrackForSettings(trackId);
    setIsSettingsModalVisible(true);
  };

  const handleUpdateTrackSettings = (trackId: string, settings: TrackSettings) => {
    // Ensure loopTime is an integer
    const loopTimeInt = Math.round(settings.loopTime);
    
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { 
        ...track, 
        loopTime: loopTimeInt,
        volume: settings.volume
      } : track
    ));
    handleVolumeChange(trackId, settings.volume);
    setIsSettingsModalVisible(false);
  };

  const handleUpdateMasterSettings = (settings: MasterSettings) => {
    // Ensure duration is an integer
    const durationInt = Math.round(settings.duration);
    
    setMasterSettings({
      ...settings,
      duration: durationInt
    });
    setMixDuration(durationInt); // Update mixDuration state with the rounded duration
    handleMasterVolumeChange(settings.volume);
    setIsSettingsModalVisible(false);
    
    console.log(`Master settings updated: duration=${durationInt}s, volume=${settings.volume}`);
  };

  // Update the formatTime helper
  const formatTime = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else {
      // Convert to minutes and round to 2 decimal places
      const minutesValue = Math.floor(seconds / 60);
      const secondsValue = Math.floor(seconds % 60);
      return `${minutesValue}m ${secondsValue}s`;
    }
  };

  // Update the SettingsModal component
  const SettingsModal = () => {
    const track = tracks.find(t => t.id === selectedTrackForSettings);
    const [tempLoopTime, setTempLoopTime] = useState(track?.loopTime || 30);
    const [tempDuration, setTempDuration] = useState(masterSettings.duration);
    const [tempVolume, setTempVolume] = useState(
      selectedTrackForSettings ? 
        track?.volume || 1 : 
        masterSettings.volume
    );
    const [isLongDuration, setIsLongDuration] = useState(
      selectedTrackForSettings ? false : masterSettings.isLongDuration
    );

    const handleSave = () => {
      const volume = Math.min(Math.max(tempVolume, 0), 1);
      
      if (selectedTrackForSettings) {
        // For individual tracks, use 1 hour or 8 hours limit
        const maxDuration = isLongDuration ? 28800 : 3600; // 8 hours or 1 hour
        handleUpdateTrackSettings(selectedTrackForSettings, {
          loopTime: Math.min(tempLoopTime, maxDuration),
          volume,
          isLongDuration
        });
      } else {
        // For master mix, use 1 hour or 8 hours
        const maxDuration = isLongDuration ? 28800 : 3600; // 8 hours or 1 hour
        handleUpdateMasterSettings({
          duration: Math.min(tempDuration, maxDuration),
          volume,
          isLongDuration
        });
      }
    };

    // Set max duration to 1 hour (3600 seconds) or 8 hours (28800 seconds) for extended mode
    const getMaxDuration = () => isLongDuration ? 28800 : 3600; // 480 minutes or 60 minutes

    return (
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.settingsModalContainer}>
          <View style={[
            styles.settingsModalContent,
            Platform.OS === 'web' && styles.settingsModalWebContent
          ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedTrackForSettings ? `Track Settings` : 'Master Settings'}
              </Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsForm}>
              <View style={styles.settingsGroup}>
                <Text style={styles.settingsLabel}>Volume</Text>
                <View style={styles.settingsVolumeContainer}>
                  <Volume2 size={20} color="#fff" />
                  <Slider
                    minimumValue={0}
                    maximumValue={1}
                    value={tempVolume}
                    onValueChange={setTempVolume}
                    minimumTrackTintColor="#6366f1"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#fff"
                    style={{ flex: 1, height: 40 }}
                  />
                  <Text style={styles.volumeValue}>
                    {Math.round(tempVolume * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.settingsGroup}>
                <View style={styles.settingsLabelRow}>
                  <Text style={styles.settingsLabel}>
                    {selectedTrackForSettings ? 'Loop Duration' : 'Mix Duration'}
                  </Text>
                  <Text style={styles.durationValue}>
                    {formatTime(selectedTrackForSettings ? tempLoopTime : tempDuration)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.longDurationToggle}
                  onPress={() => {
                    setIsLongDuration(!isLongDuration);
                    // Adjust duration when switching modes to not exceed new max
                    const newMax = !isLongDuration ? 28800 : 3600;
                    if (selectedTrackForSettings) {
                      setTempLoopTime(Math.min(tempLoopTime, newMax));
                    } else {
                      setTempDuration(Math.min(tempDuration, newMax));
                    }
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    isLongDuration && styles.checkboxChecked
                  ]}>
                    {isLongDuration && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Extended Duration (up to 8 hours)</Text>
                </TouchableOpacity>
                <View style={styles.durationSliderContainer}>
                  <Slider
                    minimumValue={1}
                    maximumValue={getMaxDuration()}
                    value={selectedTrackForSettings ? tempLoopTime : tempDuration}
                    onValueChange={(value) => {
                      // Round the value to an integer to avoid floating point issues
                      const roundedValue = Math.round(value);
                      if (selectedTrackForSettings) {
                        setTempLoopTime(roundedValue);
                      } else {
                        setTempDuration(roundedValue);
                      }
                    }}
                    minimumTrackTintColor="#6366f1"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#fff"
                    style={{ width: '100%', height: 40 }}
                  />
                  <View style={styles.durationLabels}>
                    <Text style={styles.durationLabel}>1s</Text>
                    <Text style={styles.durationLabel}>
                      {isLongDuration ? '8h' : '60m'}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedTrackForSettings && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    handleRemoveTrack(selectedTrackForSettings);
                    setIsSettingsModalVisible(false);
                  }}
                >
                  <Trash2 size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Track</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Add SaveMixModal component
  const SaveMixModal = () => (
    <Modal
      visible={isSaveMixModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setIsSaveMixModalVisible(false)}
    >
      <View style={styles.saveMixModalContainer}>
        <View style={[
          styles.saveMixModalContent,
          Platform.OS === 'web' && styles.saveMixModalWebContent
        ]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setIsSaveMixModalVisible(false);
                setMixName('');
              }}
              style={styles.closeButton}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Save Mix</Text>
            <TouchableOpacity 
              onPress={handleSaveMix}
              style={[
                styles.saveButton,
                !mixName.trim() && styles.saveButtonDisabled
              ]}
              disabled={!mixName.trim()}
            >
              <Text style={[
                styles.saveButtonText,
                !mixName.trim() && styles.saveButtonTextDisabled
              ]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.saveMixForm}>
            <Text style={styles.saveMixLabel}>Mix Name</Text>
            <TextInput
              style={styles.saveMixInput}
              placeholder="Enter mix name..."
              placeholderTextColor="#666"
              value={mixName}
              onChangeText={setMixName}
              autoFocus
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaViewContext style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mixer</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearAll}
            >
              <Text style={styles.headerButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsSaveMixModalVisible(true)}
            >
              <Text style={styles.headerButtonText}>Save Mix</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.tracksContainer}>
            {tracks.map((track, index) => (
              <View key={track.id} style={styles.trackItem}>
                {track.name ? (
                  <>
                    <View style={styles.trackTopHalf}>
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackLabel}>Track {(index + 1).toString()}</Text>
                        <Text style={styles.trackName}>{track.name}</Text>
                      </View>
                      <View style={styles.trackControls}>
                        <TouchableOpacity
                          style={[styles.trackButton, track.isPlaying && styles.trackButtonActive]}
                          onPress={() => handlePlayPause(track.id)}
                        >
                          {track.isPlaying ? (
                            <Pause size={16} color="#fff" />
                          ) : (
                            <Play size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.trackButton}
                          onPress={() => handleOpenSettings(track.id)}
                        >
                          <Settings size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.trackBottomHalf}>
                      <ProgressBar progress={track.progress} />
                      <View style={styles.volumeSliderContainer}>
                        <Volume2 size={16} color="#fff" />
                        <Slider
                          minimumValue={0}
                          maximumValue={1}
                          value={track.volume}
                          onValueChange={(value) => handleVolumeChange(track.id, value)}
                          minimumTrackTintColor="#6366f1"
                          maximumTrackTintColor="#333"
                          thumbTintColor="#fff"
                          style={{ flex: 1, height: 32 }}
                        />
                        <Text style={styles.volumeValue}>
                          {Math.round(track.volume * 100)}%
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.addSoundButton}
                    onPress={() => handleAddSound(index)}
                  >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.buttonText}>Add Sound</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {tracks.length < 8 && (
              <TouchableOpacity 
                style={styles.addTrackButton} 
                onPress={() => {
                  setTracks(prev => [
                    ...prev,
                    { id: `track-${prev.length}`, name: '', volume: 1, isPlaying: false, loopTime: 30, progress: 0 },
                  ]);
                }}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.buttonText}>Add Track</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Master Player */}
        <View style={styles.masterPlayer}>
          <TouchableOpacity
            style={[styles.masterPlayButton, isAllPlaying && styles.trackButtonActive]}
            onPress={handlePlayPauseAll}
          >
            {isAllPlaying ? (
              <Pause size={24} color="#fff" />
            ) : (
              <Play size={24} color="#fff" />
            )}
          </TouchableOpacity>
          
          <View style={styles.masterControlsContainer}>
            <ProgressBar progress={mixProgress} />
            <View style={styles.masterControls}>
              <View style={styles.masterVolumeContainer}>
                <Volume2 size={20} color="#fff" />
                <Slider
                  minimumValue={0}
                  maximumValue={1}
                  value={masterVolume}
                  onValueChange={handleMasterVolumeChange}
                  minimumTrackTintColor="#6366f1"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#fff"
                  style={{ flex: 1, height: 32 }}
                />
                <Text style={styles.volumeValue}>
                  {Math.round(masterVolume * 100)}%
                </Text>
              </View>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() => handleOpenSettings(null)}
              >
                <Settings size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Sound Picker Modal */}
      <Modal
        visible={isSoundPickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setIsSoundPickerVisible(false);
          setSelectedTrackIndex(null);
          setSearchQuery('');
        }}
      >
        <SafeAreaViewContext style={styles.modalFullScreen}>
          <View style={styles.modalFullScreenContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setIsSoundPickerVisible(false);
                  setSelectedTrackIndex(null);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Sound</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search sounds..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.soundsList}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Loading sounds...</Text>
                </View>
              ) : filteredSounds.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No sounds found</Text>
                </View>
              ) : (
                <View style={styles.soundsGrid}>
                  {filteredSounds.map(sound => {
                    // Ensure all text values are properly sanitized
                    const name = typeof sound.name === 'string' ? sound.name : String(sound.name || '');
                    const category = typeof sound.category === 'string' ? sound.category : String(sound.category || 'music');
                    
                    return (
                      <TouchableOpacity
                        key={sound.id}
                        style={styles.soundCard}
                        onPress={() => handleSelectSound(sound)}
                      >
                        <View style={styles.soundCardContent}>
                          <View style={styles.soundIconContainer}>
                            <Play size={24} color="#fff" />
                          </View>
                          <Text style={styles.soundName} numberOfLines={2}>{name}</Text>
                          <Text style={styles.soundCategory}>{category}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaViewContext>
      </Modal>

      {/* Add Settings Modal */}
      <SettingsModal />

      {/* Add SaveMixModal */}
      <SaveMixModal />
    </SafeAreaViewContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tracksContainer: {
    flex: 1,
  },
  trackItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  trackTopHalf: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackBottomHalf: {
    gap: 8,
  },
  trackInfo: {
    flex: 1,
  },
  trackLabel: {
    color: '#666',
    fontSize: 12,
  },
  trackName: {
    color: '#fff',
    fontSize: 16,
  },
  trackControls: {
    flexDirection: 'row',
    gap: 8,
  },
  trackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonActive: {
    backgroundColor: '#6366f1',
  },
  addSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  addTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262626',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  // Volume control styles
  volumeControl: {
    padding: 20,
  },
  volumeTrackName: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  volumeSliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  volumeIcon: {
    width: 24,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  volumeValue: {
    color: '#fff',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  trackContent: {
    flex: 1,
    gap: 12,
  },
  // Sound picker styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#262626',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
  },
  categoryTextActive: {
    fontWeight: 'bold',
  },
  soundsList: {
    maxHeight: 400,
  },
  soundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#262626',
    borderRadius: 8,
    marginBottom: 8,
  },
  soundName: {
    color: '#fff',
    fontSize: 16,
  },
  soundCategory: {
    color: '#666',
    fontSize: 14,
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  // Update and add new styles
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalFullScreenContent: {
    flex: 1,
    padding: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40, // Same width as close button for centering
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  soundCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  soundCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  soundIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  masterPlayer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  masterPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterControlsContainer: {
    flex: 1,
    gap: 8,
  },
  masterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterVolumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  settingsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : undefined,
  },
  settingsModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },
  settingsModalWebContent: {
    maxWidth: 500,
    marginBottom: 40,
    borderRadius: 20,
  },
  settingsForm: {
    gap: 20,
    padding: 16,
  },
  settingsGroup: {
    gap: 8,
  },
  settingsLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsInput: {
    backgroundColor: '#262626',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsVolumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  longDurationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 14,
  },
  settingsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  durationSliderContainer: {
    marginTop: 8,
  },
  durationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  durationLabel: {
    color: '#666',
    fontSize: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  saveMixModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveMixModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  saveMixModalWebContent: {
    width: 400,
  },
  saveMixForm: {
    gap: 12,
    marginTop: 20,
  },
  saveMixLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveMixInput: {
    backgroundColor: '#262626',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonTextDisabled: {
    color: '#666',
  },
});
