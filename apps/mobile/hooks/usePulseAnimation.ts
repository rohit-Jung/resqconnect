import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { ANIMATION_CONFIG } from '@/constants/emergency-tracking.constants';
import { EmergencyStatus } from '@/types/emergency.types';

export const usePulseAnimation = (status: EmergencyStatus) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === EmergencyStatus.PENDING) {
      const pulse = Animated.loop(
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
      pulse.start();
      return () => pulse.stop();
    }
  }, [status, pulseAnim]);

  return pulseAnim;
};
