import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SIGNAL_RED = '#C44536';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightButton?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    backgroundColor?: string;
  };
  showLogoutButton?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  rightButton,
  showLogoutButton = false,
  onLogout,
}) => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={OFF_WHITE} />
          </TouchableOpacity>
        ) : showLogoutButton ? (
          <TouchableOpacity
            onPress={onLogout}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={OFF_WHITE} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.headerCenter}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>{title}</Text>
        </View>
        {rightButton ? (
          <TouchableOpacity
            onPress={rightButton.onPress}
            style={[
              styles.rightButton,
              { backgroundColor: rightButton.backgroundColor || SIGNAL_RED },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name={rightButton.icon} size={24} color={OFF_WHITE} />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButtonPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  backButton: {
    padding: 10,
    backgroundColor: SIGNAL_RED,
    marginRight: 16,
  },
  backButtonPlaceholder: {
    width: 44,
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 36,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 6,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  rightButton: {
    padding: 10,
    marginLeft: 16,
  },
  rightButtonPlaceholder: {
    width: 44,
    marginLeft: 16,
  },
});

export default Header;
