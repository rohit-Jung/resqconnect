import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { ANIMATION_CONFIG } from '../constants';

// Status is app-specific (enum lives in apps currently), so accept string.
export function usePulseAnimation(status: string) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'pending') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: ANIMATION_CONFIG.PULSE_SCALE_UP,
            duration: ANIMATION_CONFIG.PULSE_DURATION,
            useNativeDriver: ANIMATION_CONFIG.USE_NATIVE_DRIVER,
          }),
          Animated.timing(pulseAnim, {
            toValue: ANIMATION_CONFIG.PULSE_SCALE_DOWN,
            duration: ANIMATION_CONFIG.PULSE_DURATION,
            useNativeDriver: ANIMATION_CONFIG.USE_NATIVE_DRIVER,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }

    pulseAnim.setValue(1);
    return;
  }, [status, pulseAnim]);

  return pulseAnim;
}
