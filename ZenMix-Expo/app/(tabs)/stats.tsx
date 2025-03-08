import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LoginOverlay from '@/components/LoginOverlay';

const StatCard = ({ value, label }: { value: number; label: string }) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const DayCard = ({ date, minutes }: { date: string; minutes: number }) => (
  <View style={styles.dayCard}>
    <Text style={styles.dayValue}>{minutes}</Text>
    <Text style={styles.dayLabel}>{date}</Text>
  </View>
);

export default function MeditationStatsScreen() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    weeklyProgress: [
      { date: 'Mon', minutes: 0 },
      { date: 'Tue', minutes: 0 },
      { date: 'Wed', minutes: 0 },
      { date: 'Thu', minutes: 0 },
      { date: 'Fri', minutes: 0 },
      { date: 'Sat', minutes: 0 },
      { date: 'Sun', minutes: 0 }
    ],
    completedSessions: 0,
    morningSessions: 0,
    eveningSessions: 0,
    mostUsedMix: {
      id: '',
      count: 0
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        if (session) {
          fetchStats();
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
        fetchStats();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  }

  async function fetchStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: sessions, error } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (sessions && Array.isArray(sessions)) {
        // Filter out invalid sessions
        const validSessions = sessions.filter(session => 
          session && 
          typeof session.duration === 'number' &&
          typeof session.created_at === 'string' &&
          typeof session.completed === 'boolean'
        );

        // Calculate basic stats
        const totalMinutes = validSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const completedSessions = validSessions.filter(s => s.completed).length;

        // Calculate weekly progress
        const now = new Date();
        const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          const dayMinutes = validSessions
            .filter(session => {
              try {
                const sessionDate = new Date(session.created_at);
                return sessionDate >= dayStart && sessionDate <= dayEnd;
              } catch (e) {
                return false;
              }
            })
            .reduce((sum, session) => sum + (session.duration || 0), 0);

          return {
            date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
            minutes: dayMinutes
          };
        }).reverse();

        // Calculate session patterns
        const morningSessions = validSessions.filter(s => {
          try {
            const hour = new Date(s.created_at).getHours();
            return hour >= 4 && hour < 12;
          } catch (e) {
            return false;
          }
        }).length;

        const eveningSessions = validSessions.filter(s => {
          try {
            const hour = new Date(s.created_at).getHours();
            return hour >= 18 || hour < 4;
          } catch (e) {
            return false;
          }
        }).length;

        // Calculate most used mix
        const mixUsage = validSessions.reduce<Record<string, number>>((acc, session) => {
          if (session.mix_id && typeof session.mix_id === 'string') {
            acc[session.mix_id] = (acc[session.mix_id] || 0) + 1;
          }
          return acc;
        }, {});

        const mostUsedMix = Object.entries(mixUsage).reduce<[string, number]>(
          (a, b) => (a[1] > b[1] ? a : b),
          ['', 0]
        );

        setStats({
          totalSessions: validSessions.length,
          totalMinutes,
          averageSessionLength: Math.round(totalMinutes / validSessions.length) || 0,
          weeklyProgress,
          completedSessions,
          morningSessions,
          eveningSessions,
          mostUsedMix: {
            id: mostUsedMix[0] || '',
            count: mostUsedMix[1] || 0
          }
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Meditation Stats</Text>
            <Text style={styles.subtitle}>Your meditation journey insights</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatCard value={stats.totalSessions} label="Total Sessions" />
            <StatCard value={stats.totalMinutes} label="Total Minutes" />
            <StatCard value={stats.averageSessionLength} label="Avg. Minutes" />
            <StatCard 
              value={Math.round((stats.completedSessions / stats.totalSessions) * 100) || 0} 
              label="Completion Rate %" 
            />
            <StatCard value={stats.morningSessions} label="Morning Sessions" />
            <StatCard value={stats.eveningSessions} label="Evening Sessions" />
            <StatCard 
              value={stats.mostUsedMix.count} 
              label="Most Used Mix" 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Progress</Text>
          <View style={styles.weeklyGrid}>
            {stats.weeklyProgress.map((day, index) => (
              <DayCard key={index} date={day.date} minutes={day.minutes} />
            ))}
          </View>
        </View>
      </ScrollView>

      <LoginOverlay 
        visible={isAuthenticated === false} 
        message="Please log in to view your meditation statistics."
        onLogin={() => setIsAuthenticated(true)}
      />
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
  },
  headerTextContainer: {
    gap: 8,
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
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
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
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  dayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 