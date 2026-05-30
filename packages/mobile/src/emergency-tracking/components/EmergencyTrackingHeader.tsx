import { Ionicons } from '@expo/vector-icons';

import { Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../constants';
import { emergencyTrackingHeaderStyles as styles } from '../stylesheet';

export function EmergencyTrackingHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.BLACK} />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>RESQ</Text>
          <Text style={styles.brandDot}>.</Text>
        </View>
        <View style={styles.headerLine} />
        <Text style={styles.tagline}>EMERGENCY TRACKING</Text>
      </View>
    </View>
  );
}
