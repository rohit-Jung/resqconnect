import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { InfoPage, SectionHeader } from '@/components/InfoPage';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const SUCCESS_GREEN = '#10B981';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'emergency_alerts',
      title: 'EMERGENCY ALERTS',
      description: 'Receive alerts for incoming emergency requests',
      enabled: true,
      icon: 'warning',
    },
    {
      id: 'status_updates',
      title: 'STATUS UPDATES',
      description: 'Get notified when your request status changes',
      enabled: true,
      icon: 'sync',
    },
    {
      id: 'provider_arrival',
      title: 'RESPONDER ARRIVAL',
      description: 'Alert when responder is arriving',
      enabled: true,
      icon: 'car',
    },
    {
      id: 'contact_notifications',
      title: 'EMERGENCY CONTACT ALERTS',
      description: 'Notify contacts when you request help',
      enabled: true,
      icon: 'people',
    },
    {
      id: 'app_updates',
      title: 'APP UPDATES',
      description: 'News about new features and improvements',
      enabled: false,
      icon: 'megaphone',
    },
    {
      id: 'tips_reminders',
      title: 'SAFETY TIPS & REMINDERS',
      description: 'Periodic safety tips and emergency preparedness',
      enabled: false,
      icon: 'bulb',
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSave = () => {
    Alert.alert('SUCCESS', 'Notification preferences saved');
    router.back();
  };

  return (
    <InfoPage title="NOTIFICATIONS" tagline="NOTIFICATION SETTINGS">
      <View style={styles.notice}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={SIGNAL_RED}
        />
        <View style={styles.noticeContent}>
          <Text style={styles.noticeText}>
            Critical emergency notifications cannot be disabled to ensure your
            safety.
          </Text>
        </View>
      </View>

      <SectionHeader title="CRITICAL" />

      {settings.slice(0, 4).map((setting, index) => (
        <View
          key={setting.id}
          style={[
            styles.settingItem,
            index < settings.slice(0, 4).length - 1 && styles.settingItemBorder,
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name={setting.icon} size={20} color={SIGNAL_RED} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>
                {setting.description}
              </Text>
            </View>
          </View>
          <Switch
            value={setting.enabled}
            onValueChange={() => {
              if (setting.id === 'emergency_alerts') {
                Alert.alert(
                  'Cannot Disable',
                  'Emergency alerts cannot be disabled for your safety.'
                );
                return;
              }
              toggleSetting(setting.id);
            }}
            trackColor={{ false: LIGHT_GRAY, true: SUCCESS_GREEN }}
            thumbColor={OFF_WHITE}
          />
        </View>
      ))}

      <SectionHeader title="OPTIONAL" />

      {settings.slice(4).map((setting, index) => (
        <View
          key={setting.id}
          style={[
            styles.settingItem,
            index < settings.slice(4).length - 1 && styles.settingItemBorder,
          ]}
        >
          <View style={styles.settingLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: LIGHT_GRAY }]}
            >
              <Ionicons name={setting.icon} size={20} color={MID_GRAY} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>
                {setting.description}
              </Text>
            </View>
          </View>
          <Switch
            value={setting.enabled}
            onValueChange={() => toggleSetting(setting.id)}
            trackColor={{ false: LIGHT_GRAY, true: SUCCESS_GREEN }}
            thumbColor={OFF_WHITE}
          />
        </View>
      ))}

      <SectionHeader title="SOUND & VIBRATION" />

      <TouchableOpacity style={styles.soundItem} activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="volume-high" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>NOTIFICATION SOUND</Text>
            <Text style={styles.settingDescription}>Emergency Alert</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={MID_GRAY} />
      </TouchableOpacity>

      <View style={[styles.soundItem, styles.settingItemBorder]}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="phone-portrait" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>VIBRATION</Text>
            <Text style={styles.settingDescription}>
              Vibrate for notifications
            </Text>
          </View>
        </View>
        <Switch
          value={true}
          onValueChange={() => {}}
          trackColor={{ false: LIGHT_GRAY, true: SUCCESS_GREEN }}
          thumbColor={OFF_WHITE}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color={OFF_WHITE} />
          <Text style={styles.saveButtonText}>SAVE PREFERENCES</Text>
        </TouchableOpacity>
      </View>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: 16,
    marginBottom: 24,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeText: {
    fontSize: 11,
    color: '#000000',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingItemBorder: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  footer: {
    marginTop: 24,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
