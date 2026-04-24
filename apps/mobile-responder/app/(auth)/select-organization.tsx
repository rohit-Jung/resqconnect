import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  type Sector,
  useLookupOrgs,
} from '@/services/control-plane/lookup.api';
import { useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

const SelectOrganizationScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOrgRouting, siloBaseUrl, orgName } = useProviderStore();
  const [sector, setSector] = useState<Sector | null>(null);

  const {
    data: orgs,
    isLoading: isOrgsLoading,
    isError,
    error,
    refetch,
  } = useLookupOrgs({
    sector: sector ?? undefined,
    status: 'active',
  });

  // If org was already selected (persisted), let user proceed.
  const canContinue = !!siloBaseUrl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Text style={styles.brandMark}>RESQ</Text>
              <Text style={styles.brandDot}>.</Text>
            </View>
            <View style={styles.headerLine} />
            <Text style={styles.tagline}>EMERGENCY RESPONSE</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>SELECT ORG</Text>
            <Text style={styles.subtitle}>
              Choose your organization to continue
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>SECTOR</Text>
            <View style={styles.statusSelector}>
              {(['hospital', 'police', 'fire'] as Sector[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    sector === s && styles.statusButtonActive,
                    { borderColor: sector === s ? PRIMARY : LIGHT_GRAY },
                  ]}
                  onPress={() => setSector(s)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusLabel,
                      sector === s && { color: PRIMARY },
                    ]}
                  >
                    {s.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>ORGANIZATION</Text>
            {!sector ? (
              <Text style={styles.subtitle}>
                Select a sector to see organizations.
              </Text>
            ) : isOrgsLoading ? (
              <ActivityIndicator color={PRIMARY} />
            ) : isError ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.subtitle}>
                  Failed to load organizations.{' '}
                  {String((error as any)?.message || '')}
                </Text>
                <TouchableOpacity
                  onPress={() => refetch()}
                  style={styles.retryButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={16} color={OFF_WHITE} />
                  <Text style={styles.retryText}>RETRY</Text>
                </TouchableOpacity>
              </View>
            ) : (orgs?.length ?? 0) === 0 ? (
              <Text style={styles.subtitle}>
                No active organizations found for this sector.
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {orgs!.map(o => (
                  <TouchableOpacity
                    key={o.id}
                    style={[
                      styles.statusButton,
                      { borderColor: LIGHT_GRAY, flex: 0 },
                    ]}
                    onPress={() => {
                      setOrgRouting({
                        siloBaseUrl: o.siloBaseUrl,
                        orgName: o.name,
                      });
                      router.replace('/(auth)/sign-in');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusLabel, { color: BLACK }]}>
                      {o.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formContainer}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Ionicons name="business" size={16} color={MID_GRAY} />
              <Text style={styles.subtitle}>
                Selected: {orgName || (canContinue ? 'Selected' : 'None')}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !canContinue && styles.continueDisabled,
              ]}
              onPress={() => router.replace('/(auth)/sign-in')}
              disabled={!canContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
    marginTop: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 42,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 8,
  },
  brandDot: {
    fontSize: 42,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 50,
  },
  headerLine: {
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 3,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: MID_GRAY,
    marginTop: 4,
    letterSpacing: 1,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OFF_WHITE,
  },
  statusButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  retryButton: {
    height: 44,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '800',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
  continueButton: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  continueDisabled: {
    opacity: 0.6,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 3,
  },
});

export default SelectOrganizationScreen;
