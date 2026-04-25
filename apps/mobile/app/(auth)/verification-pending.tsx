import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Header from '@/components/Header';
import { TOKEN_KEY } from '@/constants';
import { useGetDocumentStatus } from '@/services/document/document.api';
import { serviceProviderApi } from '@/services/provider/provider.api';
import { useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';
const WARNING_AMBER = '#F59E0B';
const SUCCESS_GREEN = '#10B981';

const VerificationPendingScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rejectionReason?: string;
    fromLogin?: string;
  }>();

  const { logout } = useProviderStore();
  const { data, isLoading, refetch } = useGetDocumentStatus(true);

  const documentStatus = data?.data?.data;

  useEffect(() => {
    if (documentStatus?.documentStatus !== 'approved') return;

    Promise.all([
      serviceProviderApi.getProfile(),
      SecureStore.getItemAsync(TOKEN_KEY),
    ])
      .then(([profile, token]) => {
        useProviderStore.getState().setProvider(profile as any);
        if (token) useProviderStore.getState().setToken(token);
        router.replace('/(provider)/dashboard');
      })
      .catch(() => {
        router.replace('/(auth)/sign-in');
      });
  }, [documentStatus, router]);

  useEffect(() => {
    const handleBackPress = () => {
      handleLogout();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await logout();
    router.replace('/(auth)/sign-in');
  };

  const handleReupload = () => {
    router.replace('/(auth)/upload-documents');
  };

  const handleRefresh = () => {
    refetch();
  };

  const isRejected =
    documentStatus?.documentStatus === 'rejected' ||
    params.rejectionReason !== undefined;
  const rejectionReason =
    documentStatus?.rejectionReason || params.rejectionReason;

  return (
    <View style={styles.container}>
      <Header
        title="DOCUMENT VERIFICATION"
        showLogoutButton={true}
        showBackButton={false}
        onLogout={handleLogout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Icon */}
        <View style={styles.statusIconContainer}>
          {isRejected ? (
            <View style={[styles.statusIcon, styles.statusIconRejected]}>
              <Ionicons name="close" size={48} color={OFF_WHITE} />
            </View>
          ) : (
            <View style={[styles.statusIcon, styles.statusIconPending]}>
              <Ionicons name="time-outline" size={48} color={OFF_WHITE} />
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {isRejected ? 'DOCUMENTS REJECTED' : 'VERIFICATION PENDING'}
          </Text>
          <Text style={styles.subtitle}>
            {isRejected
              ? 'Your documents were not approved. Please review the feedback and upload again.'
              : 'Your documents have been submitted and are being reviewed.'}
          </Text>
        </View>

        {/* Rejection Reason */}
        {isRejected && rejectionReason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>REJECTION REASON</Text>
            <View style={styles.reasonBox}>
              <View style={styles.reasonLine} />
              <Text style={styles.reasonText}>{rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Info Section */}
        {!isRejected && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>WHAT HAPPENS NEXT</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>01</Text>
              </View>
              <Text style={styles.infoText}>
                Organization admin reviews your documents
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>02</Text>
              </View>
              <Text style={styles.infoText}>
                Verification takes 24-48 hours
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>03</Text>
              </View>
              <Text style={styles.infoText}>Login once approved</Text>
            </View>
          </View>
        )}

        {/* Refresh */}
        {!isRejected && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color={SIGNAL_RED} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color={SIGNAL_RED} />
                <Text style={styles.refreshText}>CHECK STATUS</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isRejected ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleReupload}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>UPLOAD NEW DOCUMENTS</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          {isRejected ? 'ACTION REQUIRED' : 'AWAITING REVIEW'}
        </Text>
        <Text style={styles.metadataDot}>·</Text>
        <Text style={styles.metadataText}>24-48 HOURS</Text>
      </View>
    </View>
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
    paddingTop: 24,
    paddingBottom: 20,
  },
  statusIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconRejected: {
    backgroundColor: SIGNAL_RED,
  },
  statusIconPending: {
    backgroundColor: WARNING_AMBER,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    color: MID_GRAY,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  reasonContainer: {
    marginBottom: 32,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FEE2E2',
  },
  reasonLine: {
    width: 3,
    height: '100%',
    backgroundColor: SIGNAL_RED,
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: BLACK,
    letterSpacing: 1,
    lineHeight: 18,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoNumber: {
    width: 32,
    height: 32,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: BLACK,
    letterSpacing: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
    color: SIGNAL_RED,
    letterSpacing: 2,
    marginLeft: 8,
  },
  actions: {
    marginTop: 'auto',
  },
  primaryButton: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 3,
  },
  secondaryButton: {
    height: 56,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BLACK,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 3,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
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

export default VerificationPendingScreen;
