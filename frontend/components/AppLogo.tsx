import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  G,
  Circle,
} from 'react-native-svg';

interface AppLogoProps {
  size?: number;
  style?: any;
}

export default function AppLogo({ size = 80, style }: AppLogoProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        <Defs>
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#9333EA" />
          </LinearGradient>
          <LinearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E0E7FF" />
          </LinearGradient>
          <LinearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FCD34D" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="nepaliAccent" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Rounded square background */}
        <Rect x="0" y="0" width="1024" height="1024" rx="220" fill="url(#bgGradient)" />

        {/* Subtle Nepali mountain pattern */}
        <Path
          d="M0 824 L256 624 L384 724 L512 574 L640 724 L768 624 L1024 824 L1024 1024 L0 1024 Z"
          fill="url(#nepaliAccent)"
          opacity="0.4"
        />

        {/* Main chat bubble */}
        <Path
          d="M280 320 C280 264 325 220 380 220 L644 220 C699 220 744 264 744 320 L744 520 C744 576 699 620 644 620 L480 620 L380 720 L380 620 L380 620 C325 620 280 576 280 520 Z"
          fill="url(#iconGradient)"
          opacity="0.95"
        />

        {/* Inner chat lines */}
        <Rect x="340" y="340" width="280" height="32" rx="16" fill="#4F46E5" opacity="0.3" />
        <Rect x="340" y="400" width="200" height="32" rx="16" fill="#4F46E5" opacity="0.3" />
        <Rect x="340" y="460" width="240" height="32" rx="16" fill="#4F46E5" opacity="0.3" />

        {/* AI Sparkle 1 */}
        <G transform="translate(680, 160)">
          <Path d="M40 0 L48 32 L80 40 L48 48 L40 80 L32 48 L0 40 L32 32 Z" fill="url(#sparkleGradient)" />
        </G>

        {/* AI Sparkle 2 */}
        <G transform="translate(580, 120)">
          <Path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" fill="url(#sparkleGradient)" opacity="0.8" />
        </G>

        {/* AI Sparkle 3 */}
        <G transform="translate(760, 280)">
          <Path d="M25 0 L30 20 L50 25 L30 30 L25 50 L20 30 L0 25 L20 20 Z" fill="url(#sparkleGradient)" opacity="0.7" />
        </G>

        {/* Nepali sun hint */}
        <Circle cx="512" cy="850" r="60" fill="#FFFFFF" opacity="0.1" />
        <Circle cx="512" cy="850" r="40" fill="#FFFFFF" opacity="0.15" />
      </Svg>
    </View>
  );
}
