import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UI_COLORS } from '../constants';
import { headerStyles as styles } from '../stylesheet';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
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
  onBack,
  rightButton,
  showLogoutButton = false,
  onLogout,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            disabled={!onBack}
          >
            <Ionicons name="arrow-back" size={24} color={UI_COLORS.OFF_WHITE} />
          </TouchableOpacity>
        ) : showLogoutButton ? (
          <TouchableOpacity
            onPress={onLogout}
            style={styles.backButton}
            activeOpacity={0.7}
            disabled={!onLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={UI_COLORS.OFF_WHITE}
            />
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
              {
                backgroundColor:
                  rightButton.backgroundColor || UI_COLORS.SIGNAL_RED,
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightButton.icon}
              size={24}
              color={UI_COLORS.OFF_WHITE}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButtonPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
};
