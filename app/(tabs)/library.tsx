import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Music2, Users, Play, Pause, CreditCard as Edit, Trash2, Upload, Check, ChevronDown, Volume2, X, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';

const handleMixPress = async (mixId: string) => {
  try {
    console.log('Loading mix:', mixId);
    
    // Load from mixes_v2 table
    const { data: mixV2, error: mixV2Error } = await supabase
      .from('mixes_v2')
      .select('id')
      .eq('id', mixId)
      .single();
      
    if (!mixV2Error && mixV2) {
      console.log('Loading mix from mixes_v2:', mixV2);
      
      // Navigate to mixer2
      router.push({
        pathname: '/(tabs)/mixer2',
        params: {
          mixId: mixV2.id
        }
      });
      return;
    }
  } catch (err) {
    console.error('Error loading mix:', err);
    console.error(err instanceof Error ? err.message : 'Failed to load mix');
  }
};

const handleEditMix = (mix: Mix) => {
  router.push({
    pathname: '/(tabs)/mixer2',
    params: {
      mixId: mix.id
    }
  });
}; 