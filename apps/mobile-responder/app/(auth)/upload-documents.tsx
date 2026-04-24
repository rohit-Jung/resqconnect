import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Header from '@/components/Header';
import { TOKEN_KEY } from '@/constants';
import {
  documentUploadApi,
  useGetDocumentStatus,
  useUploadDocuments,
} from '@/services/document/document.api';
import { useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';
const SUCCESS_GREEN = '#10B981';

interface DocumentImage {
  uri: string;
  name: string;
  type: string;
}

const UploadDocumentsScreen: React.FC = () => {
  const router = useRouter();
  const [panCard, setPanCard] = useState<DocumentImage | null>(null);
  const [citizenship, setCitizenship] = useState<DocumentImage | null>(null);

  const { mutateAsync: uploadDocuments, isPending } = useUploadDocuments();
  const { logout } = useProviderStore();
  const { data: statusData } = useGetDocumentStatus(true);

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

  const pickImage = async (
    type: 'panCard' | 'citizenship',
    setImage: React.Dispatch<React.SetStateAction<DocumentImage | null>>
  ) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload documents.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || `${type}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = (match?.[1] || '').toLowerCase();
      const fileType =
        ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'png'
            ? 'image/png'
            : 'image/jpeg';

      setImage({
        uri: asset.uri,
        name: filename,
        type: fileType,
      });
    }
  };

  const handleSubmit = async () => {
    if (!panCard || !citizenship) {
      Alert.alert(
        'Missing Documents',
        'Please upload both PAN card and citizenship documents.'
      );
      return;
    }

    try {
      // Step 1: Get signatures for both documents
      const signatures = await documentUploadApi.getDocumentUploadSignatures();

      // Step 2: Upload files directly to Cloudinary
      const [panCardUpload, citizenshipUpload] = await Promise.all([
        documentUploadApi.uploadToCloudinary(
          panCard.uri,
          panCard.name,
          panCard.type,
          signatures.panCard
        ),
        documentUploadApi.uploadToCloudinary(
          citizenship.uri,
          citizenship.name,
          citizenship.type,
          signatures.citizenship
        ),
      ]);

      // Step 3: Confirm URLs with backend
      await uploadDocuments({
        panCardUrl: panCardUpload.secure_url,
        citizenshipUrl: citizenshipUpload.secure_url,
      });

      router.replace('/(auth)/verification-pending');
    } catch (e: any) {
      // Show actual error so we can identify which step failed.
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to upload documents. Please try again.';
      console.log('[UploadDocuments] upload failed:', {
        message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
      Alert.alert('Upload Failed', message);
    }
  };

  const DocumentCard = ({
    title,
    subtitle,
    number,
    image,
    onPress,
  }: {
    title: string;
    subtitle: string;
    number: string;
    image: DocumentImage | null;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.documentHeader}>
        <Text style={styles.documentNumber}>{number}</Text>
        <View style={styles.documentLine} />
        {image && (
          <View style={styles.checkMark}>
            <Ionicons name="checkmark" size={12} color={OFF_WHITE} />
          </View>
        )}
      </View>
      <Text style={styles.documentTitle}>{title}</Text>
      <Text style={styles.documentSubtitle}>{subtitle}</Text>

      {image ? (
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: image.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.changeOverlay}>
            <Text style={styles.changeText}>TAP TO CHANGE</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="camera-outline" size={32} color={MID_GRAY} />
          <Text style={styles.placeholderText}>TAP TO UPLOAD</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="DOCUMENT VERIFICATION"
        showLogoutButton={true}
        onLogout={handleLogout}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>SUBMIT DOCUMENTS</Text>
            <Text style={styles.subtitle}>
              Upload required documents for verification
            </Text>
          </View>

          {/* Document Cards */}
          <View style={styles.documentsContainer}>
            <DocumentCard
              title="PAN CARD"
              subtitle="Permanent Account Number"
              number="01"
              image={panCard}
              onPress={() => pickImage('panCard', setPanCard)}
            />

            <DocumentCard
              title="CITIZENSHIP"
              subtitle="National Identity Document"
              number="02"
              image={citizenship}
              onPress={() => pickImage('citizenship', setCitizenship)}
            />
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={[styles.infoDot, { backgroundColor: SIGNAL_RED }]} />
              <Text style={styles.infoText}>
                Documents will be reviewed within 24-48 hours
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoDot, { backgroundColor: SIGNAL_RED }]} />
              <Text style={styles.infoText}>
                Accepted formats: JPG, PNG, PDF
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoDot, { backgroundColor: SIGNAL_RED }]} />
              <Text style={styles.infoText}>Maximum file size: 5MB</Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!panCard || !citizenship) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!panCard || !citizenship || isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color={OFF_WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>SUBMIT FOR REVIEW</Text>
            )}
          </TouchableOpacity>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>SECURE UPLOAD</Text>
            <Text style={styles.metadataDot}>·</Text>
            <Text style={styles.metadataText}>END-TO-END ENCRYPTED</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: MID_GRAY,
    marginTop: 4,
    letterSpacing: 1,
  },
  documentsContainer: {
    marginBottom: 24,
  },
  documentCard: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 20,
    marginBottom: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 1,
  },
  documentLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginLeft: 12,
  },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 16,
  },
  imagePreview: {
    height: 120,
    backgroundColor: LIGHT_GRAY,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeText: {
    fontSize: 9,
    fontWeight: '600',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
  placeholder: {
    height: 120,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginTop: 8,
  },
  infoSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  infoText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  submitButton: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: LIGHT_GRAY,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 3,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
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

export default UploadDocumentsScreen;
