import { View, StyleSheet, Platform, Dimensions, useWindowDimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABLET_WIDTH = 768;

export function TabletViewContainer({ children }: { children: React.ReactNode }) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState({ width: windowWidth });

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setDimensions({ width: Dimensions.get('window').width });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (Platform.OS !== 'web') {
    // For mobile, ensure we're using a flex container with proper insets
    return (
      <View style={[
        styles.mobileContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }
      ]}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.content,
        { width: Math.min(TABLET_WIDTH, dimensions.width) }
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

// Web-specific styles
if (Platform.OS === 'web') {
  Object.assign(styles, {
    container: {
      ...styles.container,
      width: '100%',
      height: '100%',
    },
  });
} 