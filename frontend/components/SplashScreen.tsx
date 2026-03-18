import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import AppLogo from './AppLogo';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />
      
      {/* Logo */}
      <AppLogo size={160} />
      
      {/* App name */}
      <Text style={styles.appName}>Sahayak</Text>
      <Text style={styles.tagline}>Your Nepali AI Assistant</Text>
      
      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
    opacity: 0.05,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    opacity: 0.6,
  },
  loadingDotDelay1: {
    opacity: 0.8,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});
