import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Calendar, Clock, Timer, TrendingUp, Activity, Sun, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface MeditationStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  streak: number;
  lastWeekSessions: number;
  lastWeekMinutes: number;
  morningSessionsCount: number;
  eveningSessionsCount: number;
  longestSession: number;
  mostUsedMix: {
    name: string;
    usageCount: number;
  };
  weeklyProgress: {
    date: string;
    minutes: number;
  }[];
}

export default function MeditationStatsScreen() {
  const [stats, setStats] = useState<MeditationStats>({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    streak: 0,
    lastWeekSessions: 0,
    lastWeekMinutes: 0,
    morningSessionsCount: 0,
    eveningSessionsCount: 0,
    longestSession: 0,
    mostUsedMix: {
      name: '',
      usageCount: 0
    },
    weeklyProgress: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeditationStats();
  }, []);

  async function fetchMeditationStats() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch all sessions
      const { data: sessions, error } = await supabase
        .from('meditation_sessions')
        .select(`
          *,
          mixes (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      if (sessions) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const lastWeekSessions = sessions.filter(session => 
          new Date(session.started_at) > oneWeekAgo
        );

        const morningSessionsCount = sessions.filter(session => {
          const hour = new Date(session.started_at).getHours();
          return hour >= 4 && hour < 12;
        }).length;

        const eveningSessionsCount = sessions.filter(session => {
          const hour = new Date(session.started_at).getHours();
          return hour >= 18 || hour < 4;
        }).length;

        // Calculate most used mix
        const mixUsage = sessions.reduce((acc, session) => {
          if (session.mix_id && session.mixes) {
            const mixName = session.mixes.name;
            acc[mixName] = (acc[mixName] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const mostUsedMix = Object.entries(mixUsage).reduce((a, b) => 
          (a[1] > b[1] ? a : b), ['', 0]
        );

        // Calculate weekly progress
        const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          const dayMinutes = sessions
            .filter(session => {
              const sessionDate = new Date(session.started_at);
              return sessionDate >= dayStart && sessionDate <= dayEnd;
            })
            .reduce((sum, session) => sum + session.duration, 0);

          return {
            date: dayStart.toISOString().split('T')[0],
            minutes: dayMinutes
          };
        }).reverse();

        setStats({
          totalSessions: sessions.length,
          totalMinutes: sessions.reduce((sum, session) => sum + session.duration, 0),
          averageSessionLength: Math.round(
            sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length
          ) || 0,
          streak: calculateStreak(sessions),
          lastWeekSessions: lastWeekSessions.length,
          lastWeekMinutes: lastWeekSessions.reduce((sum, session) => sum + session.duration, 0),
          morningSessionsCount,
          eveningSessionsCount,
          longestSession: Math.max(...sessions.map(s => s.duration)),
          mostUsedMix: {
            name: mostUsedMix[0],
            usageCount: mostUsedMix[1] as number
          },
          weeklyProgress
        });
      }
    } catch (err) {
      console.error('Error fetching meditation stats:', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateStreak(sessions: any[]): number {
    if (!sessions.length) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = today;
    
    while (true) {
      const hasSessionOnDay = sessions.some(session => {
        const sessionDate = new Date(session.started_at);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime();
      });
      
      if (!hasSessionOnDay) break;
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Meditation Stats</Text>
            <Text style={styles.subtitle}>Your meditation journey insights</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#4338ca', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Calendar size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#7c3aed', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Clock size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes Meditated</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#0ea5e9', '#38bdf8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Timer size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.averageSessionLength}</Text>
            <Text style={styles.statLabel}>Avg. Minutes/Session</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#10b981', '#34d399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Progress</Text>
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStatsCard}>
              <Activity size={24} color="#6366f1" />
              <View>
                <Text style={styles.weeklyStatsValue}>{stats.lastWeekSessions}</Text>
                <Text style={styles.weeklyStatsLabel}>Sessions</Text>
              </View>
            </View>
            <View style={styles.weeklyStatsCard}>
              <Clock size={24} color="#6366f1" />
              <View>
                <Text style={styles.weeklyStatsValue}>{stats.lastWeekMinutes}</Text>
                <Text style={styles.weeklyStatsLabel}>Minutes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Patterns</Text>
          <View style={styles.patternGrid}>
            <View style={styles.patternCard}>
              <Sun size={24} color="#6366f1" />
              <Text style={styles.patternValue}>{stats.morningSessionsCount}</Text>
              <Text style={styles.patternLabel}>Morning Sessions</Text>
            </View>
            <View style={styles.patternCard}>
              <Moon size={24} color="#6366f1" />
              <Text style={styles.patternValue}>{stats.eveningSessionsCount}</Text>
              <Text style={styles.patternLabel}>Evening Sessions</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          <View style={styles.recordsCard}>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>Longest Session</Text>
              <Text style={styles.recordValue}>{stats.longestSession} minutes</Text>
            </View>
            {stats.mostUsedMix.name && (
              <View style={styles.recordItem}>
                <Text style={styles.recordLabel}>Favorite Mix</Text>
                <Text style={styles.recordValue}>
                  {stats.mostUsedMix.name} ({stats.mostUsedMix.usageCount} times)
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    gap: 16,
  },
  weeklyStatsCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyStatsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  weeklyStatsLabel: {
    fontSize: 14,
    color: '#666',
  },
  patternGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  patternCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  patternValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  patternLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recordsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  recordItem: {
    marginBottom: 16,
  },
  recordLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
}); 