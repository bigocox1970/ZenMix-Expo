import React from 'react';
import { Modal, View, StyleSheet, Platform, useWindowDimensions, ModalProps } from 'react-native';

const TABLET_WIDTH = 768;

interface TabletModalProps extends ModalProps {
  children: React.ReactNode;
}

export function TabletModal({ children, ...props }: TabletModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  
  // For non-web platforms, just use the regular Modal
  if (Platform.OS !== 'web') {
    return <Modal {...props}>{children}</Modal>;
  }
  
  // For web, wrap the content in a centered container with max width
  return (
    <Modal {...props}>
      <View style={styles.container}>
        <View style={[
          styles.content,
          { width: Math.min(TABLET_WIDTH, windowWidth * 0.95) }
        ]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '90%',
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