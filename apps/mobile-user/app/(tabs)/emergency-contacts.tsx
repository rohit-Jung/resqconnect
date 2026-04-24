import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CreateEmergencyContactData,
  EmergencyContact,
  UpdateEmergencyContactData,
  emergencyContactsApi,
} from '@/services/emergency-contacts/emergency-contacts.api';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';
const SUCCESS_GREEN = '#10B981';

const RELATIONSHIPS = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Friend',
  'Relative',
  'Colleague',
  'Other',
];

const NOTIFICATION_METHODS = [
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'APP' },
  { value: 'both', label: 'BOTH' },
];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null
  );
  const [formData, setFormData] = useState<CreateEmergencyContactData>({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
    notifyOnEmergency: true,
    notificationMethod: 'sms',
  });

  const {
    data: contacts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: emergencyContactsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmergencyContactData) =>
      emergencyContactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      setIsModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Emergency contact added successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to add contact'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEmergencyContactData;
    }) => emergencyContactsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      setIsModalVisible(false);
      setEditingContact(null);
      resetForm();
      Alert.alert('Success', 'Contact updated successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update contact'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emergencyContactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      Alert.alert('Success', 'Contact deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to delete contact'
      );
    },
  });

  const toggleNotificationMutation = useMutation({
    mutationFn: (id: string) => emergencyContactsApi.toggleNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Failed to update notification setting'
      );
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
      notifyOnEmergency: true,
      notificationMethod: 'sms',
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingContact(null);
    setIsModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
      email: contact.email || '',
      notifyOnEmergency: contact.notifyOnEmergency,
      notificationMethod: contact.notificationMethod,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phoneNumber || !formData.relationship) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(contact.id),
        },
      ]
    );
  };

  const handleToggleNotification = (contact: EmergencyContact) => {
    toggleNotificationMutation.mutate(contact.id);
  };

  const renderContactCard = (contact: EmergencyContact) => (
    <View key={contact.id} style={styles.contactCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {contact.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name.toUpperCase()}</Text>
          <Text style={styles.contactRelation}>{contact.relationship}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={MID_GRAY} />
          <Text style={styles.detailText}>{contact.phoneNumber}</Text>
        </View>
        {contact.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={MID_GRAY} />
            <Text style={styles.detailText}>{contact.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.notifyRow}>
          <Text style={styles.notifyLabel}>NOTIFY</Text>
          <Switch
            value={contact.notifyOnEmergency}
            onValueChange={() => handleToggleNotification(contact)}
            trackColor={{ false: LIGHT_GRAY, true: SUCCESS_GREEN }}
            thumbColor={OFF_WHITE}
          />
        </View>
        <Text style={styles.methodText}>
          VIA: {contact.notificationMethod.toUpperCase()}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(contact)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={16} color={PRIMARY} />
          <Text style={styles.actionText}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(contact)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={SIGNAL_RED} />
          <Text style={[styles.actionText, styles.deleteText]}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboard}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? 'EDIT CONTACT' : 'ADD CONTACT'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={MID_GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>NAME *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={MID_GRAY}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter name"
                    placeholderTextColor={MID_GRAY}
                    value={formData.name}
                    onChangeText={text =>
                      setFormData({ ...formData, name: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>PHONE NUMBER *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={MID_GRAY}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={MID_GRAY}
                    keyboardType="phone-pad"
                    value={formData.phoneNumber}
                    onChangeText={text =>
                      setFormData({ ...formData, phoneNumber: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>EMAIL (OPTIONAL)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={MID_GRAY}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email"
                    placeholderTextColor={MID_GRAY}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={text =>
                      setFormData({ ...formData, email: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>RELATIONSHIP *</Text>
                <View style={styles.relationshipGrid}>
                  {RELATIONSHIPS.map(rel => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.relationshipChip,
                        formData.relationship === rel &&
                          styles.relationshipChipActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, relationship: rel })
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.relationshipText,
                          formData.relationship === rel &&
                            styles.relationshipTextActive,
                        ]}
                      >
                        {rel.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.toggleRow}>
                  <Text style={styles.formLabel}>NOTIFY ON EMERGENCY</Text>
                  <Switch
                    value={formData.notifyOnEmergency}
                    onValueChange={value =>
                      setFormData({ ...formData, notifyOnEmergency: value })
                    }
                    trackColor={{ false: LIGHT_GRAY, true: PRIMARY }}
                    thumbColor={OFF_WHITE}
                  />
                </View>
              </View>

              {formData.notifyOnEmergency && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>NOTIFICATION METHOD</Text>
                  <View style={styles.methodGrid}>
                    {NOTIFICATION_METHODS.map(method => (
                      <TouchableOpacity
                        key={method.value}
                        style={[
                          styles.methodOption,
                          formData.notificationMethod === method.value &&
                            styles.methodOptionActive,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            notificationMethod: method.value as
                              | 'sms'
                              | 'push'
                              | 'both',
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.methodOptionText,
                            formData.notificationMethod === method.value &&
                              styles.methodOptionTextActive,
                          ]}
                        >
                          {method.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                activeOpacity={0.8}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color={OFF_WHITE} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingContact ? 'UPDATE CONTACT' : 'ADD CONTACT'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={openAddModal}
          style={styles.addButton}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={OFF_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>EMERGENCY CONTACTS</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={PRIMARY}
          />
          <Text style={styles.infoText}>
            Your emergency contacts will be notified when you request emergency
            assistance.
          </Text>
        </View>

        {/* Contact List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : contacts && contacts.length > 0 ? (
          contacts.map(renderContactCard)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={64} color={LIGHT_GRAY} />
            </View>
            <Text style={styles.emptyTitle}>NO CONTACTS YET</Text>
            <Text style={styles.emptyDescription}>
              Add contacts who should be notified in emergencies
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>ADD FIRST CONTACT</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  headerContent: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 28,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 28,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 34,
  },
  headerLine: {
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  addButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    padding: 8,
    backgroundColor: SIGNAL_RED,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DBEAFE',
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: PRIMARY,
    letterSpacing: 0.5,
    lineHeight: 16,
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  contactCard: {
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: OFF_WHITE,
    letterSpacing: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1,
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  cardDetails: {
    paddingLeft: 60,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: MID_GRAY,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_GRAY,
    padding: 12,
    marginBottom: 12,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginRight: 8,
  },
  methodText: {
    fontSize: 9,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  deleteButton: {
    borderColor: SIGNAL_RED,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
    color: PRIMARY,
    letterSpacing: 1,
    marginLeft: 4,
  },
  deleteText: {
    color: SIGNAL_RED,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 12,
    color: MID_GRAY,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: OFF_WHITE,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY,
    paddingVertical: 12,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  relationshipChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    margin: 4,
  },
  relationshipChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  relationshipText: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  relationshipTextActive: {
    color: OFF_WHITE,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodGrid: {
    flexDirection: 'row',
  },
  methodOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    marginRight: 8,
  },
  methodOptionActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  methodOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  methodOptionTextActive: {
    color: OFF_WHITE,
  },
  submitButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
});
