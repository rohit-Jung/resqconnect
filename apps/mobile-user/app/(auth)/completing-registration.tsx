import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';
const SUCCESS_GREEN = '#10B981';

const CompletingRegistrationScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const completingTimer = setTimeout(() => {
      setIsCompleted(true);
    }, 2000);

    const redirectTimer = setTimeout(() => {
      router.replace('/(auth)/sign-in');
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(completingTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.container}>
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(auth)/sign-in')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={OFF_WHITE} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.brandRow}>
                <Text style={styles.brandMark}>RESQ</Text>
                <Text style={styles.brandDot}>.</Text>
              </View>
              <View style={styles.headerLine} />
              <Text style={styles.tagline}>EMERGENCY RESPONSE</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {isCompleted ? (
              <>
                <View style={styles.successIconContainer}>
                  <View style={styles.successRipple} />
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color={OFF_WHITE} />
                  </View>
                </View>
                <Text style={styles.title}>ACCOUNT</Text>
                <Text style={styles.successSubtitle}>CREATED</Text>
                <View style={styles.statusBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={SUCCESS_GREEN}
                  />
                  <Text style={styles.statusText}>VERIFICATION PENDING</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: '100%', backgroundColor: SUCCESS_GREEN },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>REDIRECTING...</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.loadingIconContainer}>
                  <View style={styles.loadingRing} />
                  <ActivityIndicator size="large" color={PRIMARY} />
                </View>
                <Text style={styles.title}>SETTING UP</Text>
                <Text style={styles.loadingSubtitle}>YOUR ACCOUNT</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress}% COMPLETE</Text>
                </View>
                <View style={styles.stepsContainer}>
                  <View style={styles.stepRow}>
                    <Ionicons
                      name={
                        progress > 25 ? 'checkmark-circle' : 'ellipse-outline'
                      }
                      size={16}
                      color={progress > 25 ? SUCCESS_GREEN : MID_GRAY}
                    />
                    <Text
                      style={[
                        styles.stepText,
                        progress > 25 && styles.stepTextActive,
                      ]}
                    >
                      CREATING PROFILE
                    </Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Ionicons
                      name={
                        progress > 50 ? 'checkmark-circle' : 'ellipse-outline'
                      }
                      size={16}
                      color={progress > 50 ? SUCCESS_GREEN : MID_GRAY}
                    />
                    <Text
                      style={[
                        styles.stepText,
                        progress > 50 && styles.stepTextActive,
                      ]}
                    >
                      CONFIGURING SETTINGS
                    </Text>
                  </View>
                  <View style={styles.stepRow}>
                    <Ionicons
                      name={
                        progress > 75 ? 'checkmark-circle' : 'ellipse-outline'
                      }
                      size={16}
                      color={progress > 75 ? SUCCESS_GREEN : MID_GRAY}
                    />
                    <Text
                      style={[
                        styles.stepText,
                        progress > 75 && styles.stepTextActive,
                      ]}
                    >
                      FINALIZING SETUP
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>SECURE REGISTRATION</Text>
            <Text style={styles.metadataDot}>·</Text>
            <Text style={styles.metadataText}>24/7 RESPONSE</Text>
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 16,
  },
  backButton: {
    padding: 10,
    backgroundColor: SIGNAL_RED,
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  loadingRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: PRIMARY,
    opacity: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 2,
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 3,
    marginBottom: 32,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successRipple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: SUCCESS_GREEN,
    opacity: 0.2,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSubtitle: {
    fontSize: 24,
    fontWeight: '900',
    color: SUCCESS_GREEN,
    letterSpacing: 4,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    marginBottom: 32,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  stepsContainer: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: LIGHT_GRAY,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginLeft: 12,
  },
  stepTextActive: {
    color: BLACK,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  metadataText: {
    fontSize: 9,
    color: MID_GRAY,
    letterSpacing: 2,
  },
  metadataDot: {
    fontSize: 9,
    color: SIGNAL_RED,
    marginHorizontal: 8,
  },
});

export default CompletingRegistrationScreen;
