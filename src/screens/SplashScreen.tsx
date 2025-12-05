import React from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Main fade and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, scaleAnim, glowAnim, shimmerAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Animated background gradient circles */}
      <Animated.View style={[styles.bgCircle1, {opacity: glowOpacity}]} />
      <Animated.View style={[styles.bgCircle2, {opacity: glowOpacity}]} />
      
      {/* Main content */}
      <Animated.View 
        style={[
          styles.content, 
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          }
        ]}
      >
        {/* Logo with glow */}
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoGlow, {opacity: glowOpacity}]} />
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>S</Text>
          </View>
        </View>
        
        {/* App Name with shimmer */}
        <View style={styles.nameContainer}>
          <Text style={styles.appName}>Sage</Text>
        </View>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Your Personal AI Assistant</Text>
        
        {/* Privacy badge */}
        <View style={styles.privacyBadge}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.privacyText}>100% Private & Offline</Text>
        </View>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>All conversations stay on your device</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#6366f1',
    top: -100,
    right: -100,
    opacity: 0.1,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#8b5cf6',
    bottom: -50,
    left: -50,
    opacity: 0.1,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#6366f1',
    top: -10,
    left: -10,
    opacity: 0.4,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#818cf8',
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  nameContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  appName: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 3,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 100,
  },
  tagline: {
    fontSize: 17,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 32,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a5b4fc',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    letterSpacing: 0.3,
    marginTop: 8,
  },
});
