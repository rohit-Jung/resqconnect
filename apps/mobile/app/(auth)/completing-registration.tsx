import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Header from '@/components/Header';

const SIGNAL_RED = '#C44536';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const BLACK = '#000000';
const SUCCESS_GREEN = '#10B981';

const CompletingRegistrationScreen: React.FC = () => {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completingTimer = setTimeout(() => {
      setIsCompleted(true);
    }, 2000);

    const redirectTimer = setTimeout(() => {
      router.replace('/(auth)/sign-in');
    }, 4000);

    return () => {
      clearTimeout(completingTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Header title="REGISTRATION" />

      <View style={styles.content}>
        {isCompleted ? (
          <>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={48} color={OFF_WHITE} />
            </View>
            <Text style={styles.title}>REGISTRATION</Text>
            <Text style={styles.successSubtitle}>COMPLETED</Text>
            <Text style={styles.description}>Redirecting to login...</Text>
          </>
        ) : (
          <>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={SIGNAL_RED} />
            </View>
            <Text style={styles.title}>REGISTRATION</Text>
            <Text style={styles.completingSubtitle}>IN PROGRESS</Text>
            <Text style={styles.description}>
              Please wait while we set up your account...
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: SUCCESS_GREEN,
    letterSpacing: 4,
    marginBottom: 16,
  },
  completingSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 4,
    marginBottom: 16,
  },
  description: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default CompletingRegistrationScreen;
