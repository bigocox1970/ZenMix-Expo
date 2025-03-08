import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Clock, Calendar, TrendingUp, CirclePlay as PlayCircle, Timer, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  streak: number;
}

interface RecommendedMix {
  id: string;
  name: string;
  duration: number;
  imageUrl: string;
  category: string;
}

export default function HomeScreen() {
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    streak: 0,
  });
  const [recommendedMixes, setRecommendedMixes] = useState<RecommendedMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const [greeting, setGreeting] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    fetchUserStats();
    fetchUserProfile();
    fetchRecommendedMixes();
    setGreeting(getGreeting());
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single();

      if (profile?.nickname) {
        setNickname(profile.nickname);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  async function fetchUserStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: sessions, error } = await supabase
        .from('meditation_sessions')
        .select('duration')
        .eq('user_id', user.id);

      if (error) throw error;

      if (sessions) {
        const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
        setStats({
          totalSessions: sessions.length,
          totalMinutes,
          averageSessionLength: sessions.length ? Math.round(totalMinutes / sessions.length) : 0,
          streak: calculateStreak(sessions),
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  function calculateStreak(sessions: any[]): number {
    return 5; // Placeholder
  }

  async function fetchRecommendedMixes() {
    try {
      setLoading(true);
      const { data: mixes, error } = await supabase
        .from('mixes')
        .select('*')
        .eq('is_public', true)
        .limit(5);

      if (error) throw error;

      const recommendations: RecommendedMix[] = [
        {
          id: '1',
          name: 'Morning Calm',
          duration: 15,
          imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
          category: 'Morning',
        },
        {
          id: '2',
          name: 'Peaceful Night',
          duration: 20,
          imageUrl: 'https://images.unsplash.com/photo-1507502707541-f369a3b18502?w=800',
          category: 'Evening',
        },
        {
          id: '3',
          name: 'Focus Flow',
          duration: 30,
          imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800',
          category: 'Focus',
        },
      ];

      setRecommendedMixes(recommendations);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.welcomeText}>
          {nickname ? nickname : 'Welcome to ZenMix'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
          </View>
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#4338ca', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Calendar size={20} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={[styles.statLabel, styles.statLabelLight]}>Total Sessions</Text>
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['#7c3aed', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Clock size={20} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.totalMinutes}</Text>
                <Text style={[styles.statLabel, styles.statLabelLight]}>Minutes Meditated</Text>
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['#0ea5e9', '#38bdf8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Timer size={20} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.averageSessionLength}</Text>
                <Text style={[styles.statLabel, styles.statLabelLight]}>Avg. Minutes/Session</Text>
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['#10b981', '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <TrendingUp size={20} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.streak}</Text>
                <Text style={[styles.statLabel, styles.statLabelLight]}>Day Streak</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.recommendationsScroll}
            contentContainerStyle={styles.recommendationsContainer}
          >
            {recommendedMixes.map((mix) => (
              <TouchableOpacity 
                key={mix.id}
                style={[
                  styles.recommendationCard,
                  { width: Math.min(width * 0.7, 400) }
                ]}
                onPress={() => router.push({
                  pathname: '/(tabs)/mixer',
                  params: { 
                    mixId: mix.id,
                    from: '/(tabs)' 
                  }
                })}
              >
                <Image 
                  source={{ uri: mix.imageUrl }}
                  style={styles.recommendationImage}
                />
                <View style={styles.recommendationContent}>
                  <View>
                    <Text style={styles.recommendationCategory}>{mix.category}</Text>
                    <Text style={styles.recommendationTitle}>{mix.name}</Text>
                    <Text style={styles.recommendationDuration}>{mix.duration} minutes</Text>
                  </View>
                  <ChevronRight size={20} color="#6366f1" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/library')}
            >
              <Text style={styles.quickActionTitle}>Browse Library</Text>
              <Text style={styles.quickActionDescription}>
                Explore our collection of meditation tracks and mixes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/stats')}
            >
              <Text style={styles.quickActionTitle}>View Progress</Text>
              <Text style={styles.quickActionDescription}>
                Track your meditation journey and achievements
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#6366f1',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  recommendationsScroll: {
    paddingLeft: 20,
  },
  recommendationsContainer: {
    paddingRight: 20,
  },
  recommendationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    maxWidth: 400,
  },
  recommendationImage: {
    width: '100%',
    height: 160,
  },
  recommendationContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationCategory: {
    color: '#6366f1',
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationDuration: {
    color: '#666',
    fontSize: 14,
  },
  quickActions: {
    padding: 20,
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickActionDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 4,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statTextContainer: {
    flexDirection: 'column',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'left',
  },
  statLabelLight: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  seeAllText: {
    color: '#6366f1',
    fontSize: 16,
  },
});
