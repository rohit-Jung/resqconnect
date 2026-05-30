import { Ionicons } from '@expo/vector-icons';

import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

// Enable LayoutAnimation on Android.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  defaultExpanded?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  icon,
  iconColor = '#374151',
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(
    new Animated.Value(defaultExpanded ? 1 : 0)
  ).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.itemHeader}
      >
        <View style={styles.titleRow}>
          {icon && (
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={20} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </Animated.View>
      </TouchableOpacity>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
};

interface AccordionProps {
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return <View>{children}</View>;
};

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    // Android shadow.
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    marginRight: 12,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default Accordion;
