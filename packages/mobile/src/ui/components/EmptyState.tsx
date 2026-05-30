import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { UI_COLORS } from '../constants';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = UI_COLORS.LIGHT_GRAY,
  iconSize = 64,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{actionLabel.toUpperCase()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: UI_COLORS.LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_COLORS.BLACK,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: UI_COLORS.MID_GRAY,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: UI_COLORS.PRIMARY,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: UI_COLORS.OFF_WHITE,
    letterSpacing: 2,
  },
});

export default EmptyState;
