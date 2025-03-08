import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Mixer3() {
  const { mixId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMix() {
      try {
        console.log('Mixer3: Starting to load mix:', mixId);
        
        // Just get the mix tracks IDs first
        const { data: mixTracks, error: tracksError } = await supabase
          .from('mix_tracks_v2')
          .select('track_id')
          .eq('mix_id', mixId)
          .order('track_number', { ascending: true });

        if (tracksError) {
          console.error('Mixer3: Error loading mix tracks:', tracksError);
          return;
        }

        console.log('Mixer3: Loaded mix tracks:', mixTracks);
        
      } catch (err) {
        console.error('Mixer3: Error in loadMix:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMix();
  }, [mixId]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff' }}>
        {loading ? 'Loading...' : 'Mix Loaded - Check Console'}
      </Text>
    </View>
  );
} 