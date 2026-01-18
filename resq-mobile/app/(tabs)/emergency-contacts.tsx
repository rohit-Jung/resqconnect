import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useRouter } from 'expo-router';
import {
  emergencyContactsApi,
  EmergencyContact,
  CreateEmergencyContactData,
  UpdateEmergencyContactData,
} from '@/services/emergency-contacts/emergency-contacts.api';

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
  { value: 'sms', label: 'SMS Only' },
  { value: 'push', label: 'App Notification' },
  { value: 'both', label: 'Both' },
];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState<CreateEmergencyContactData>({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
    notifyOnEmergency: true,
    notificationMethod: 'sms',
  });

  // Fetch emergency contacts
  const {
    data: contacts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: emergencyContactsApi.getAll,
  });

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEmergencyContactData) => emergencyContactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      setIsModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Emergency contact added successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add contact');
    },
  });

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmergencyContactData }) =>
      emergencyContactsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      setIsModalVisible(false);
      setEditingContact(null);
      resetForm();
      Alert.alert('Success', 'Contact updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update contact');
    },
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => emergencyContactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      Alert.alert('Success', 'Contact deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to delete contact');
    },
  });

  // Toggle notification mutation
  const toggleNotificationMutation = useMutation({
    mutationFn: (id: string) => emergencyContactsApi.toggleNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update notification setting'
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
    Alert.alert('Delete Contact', `Are you sure you want to delete ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(contact.id),
      },
    ]);
  };

  const handleToggleNotification = (contact: EmergencyContact) => {
    toggleNotificationMutation.mutate(contact.id);
  };

  const renderContactCard = (contact: EmergencyContact) => (
    <View
      key={contact.id}
      className="mb-4 rounded-2xl bg-white p-4 shadow-sm"
      style={{ elevation: 2 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Inter' }}>
            {contact.name}
          </Text>
          <Text className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
            {contact.relationship}
          </Text>
          <Text className="mt-1 text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
            📞 {contact.phoneNumber}
          </Text>
          {contact.email && (
            <Text className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
              ✉️ {contact.email}
            </Text>
          )}
        </View>
        <View className="items-end">
          <View className="flex-row items-center">
            <Text className="mr-2 text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
              Notify
            </Text>
            <Switch
              value={contact.notifyOnEmergency}
              onValueChange={() => handleToggleNotification(contact)}
              trackColor={{ false: '#ccc', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </View>
          <Text className="mt-1 text-xs text-gray-400" style={{ fontFamily: 'Inter' }}>
            via {contact.notificationMethod}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row justify-end border-t border-gray-100 pt-3">
        <TouchableOpacity
          onPress={() => openEditModal(contact)}
          className="mr-4 flex-row items-center">
          <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
          <Text className="ml-1 text-sm text-blue-500" style={{ fontFamily: 'Inter' }}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(contact)} className="flex-row items-center">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text className="ml-1 text-sm text-red-500" style={{ fontFamily: 'Inter' }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsModalVisible(false)}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text
              className="text-xl text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View className="mb-4">
              <Text
                className="mb-1 text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Inter' }}>
                Name *
              </Text>
              <TextInput
                className="rounded-xl border border-gray-300 px-4 py-3"
                placeholder="Enter name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={{ fontFamily: 'Inter' }}
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <Text
                className="mb-1 text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Inter' }}>
                Phone Number *
              </Text>
              <TextInput
                className="rounded-xl border border-gray-300 px-4 py-3"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
                style={{ fontFamily: 'Inter' }}
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text
                className="mb-1 text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Inter' }}>
                Email (Optional)
              </Text>
              <TextInput
                className="rounded-xl border border-gray-300 px-4 py-3"
                placeholder="Enter email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ fontFamily: 'Inter' }}
              />
            </View>

            {/* Relationship */}
            <View className="mb-4">
              <Text
                className="mb-1 text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Inter' }}>
                Relationship *
              </Text>
              <View className="flex-row flex-wrap">
                {RELATIONSHIPS.map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    onPress={() => setFormData({ ...formData, relationship: rel })}
                    className={`mb-2 mr-2 rounded-full px-4 py-2 ${
                      formData.relationship === rel ? 'bg-primary' : 'bg-gray-100'
                    }`}>
                    <Text
                      className={`text-sm ${
                        formData.relationship === rel ? 'text-white' : 'text-gray-700'
                      }`}
                      style={{ fontFamily: 'Inter' }}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notify on Emergency */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
                Notify on Emergency
              </Text>
              <Switch
                value={formData.notifyOnEmergency}
                onValueChange={(value) => setFormData({ ...formData, notifyOnEmergency: value })}
                trackColor={{ false: '#ccc', true: '#22c55e' }}
                thumbColor="#fff"
              />
            </View>

            {/* Notification Method */}
            {formData.notifyOnEmergency && (
              <View className="mb-4">
                <Text
                  className="mb-2 text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Inter' }}>
                  Notification Method
                </Text>
                <View className="flex-row">
                  {NOTIFICATION_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          notificationMethod: method.value as 'sms' | 'push' | 'both',
                        })
                      }
                      className={`mr-2 flex-1 rounded-xl py-3 ${
                        formData.notificationMethod === method.value ? 'bg-primary' : 'bg-gray-100'
                      }`}>
                      <Text
                        className={`text-center text-sm ${
                          formData.notificationMethod === method.value
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                        style={{ fontFamily: 'Inter' }}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="mt-4 rounded-xl bg-primary py-4">
              {createMutation.isPending || updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className="text-center text-lg text-white"
                  style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaContainer>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between bg-primary px-6 pb-4 pt-2">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text
              className="text-2xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Emergency Contacts
            </Text>
          </View>
          <TouchableOpacity onPress={openAddModal} className="rounded-full bg-white/20 p-2">
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View className="mx-4 mt-4 rounded-xl bg-blue-50 p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text className="ml-2 flex-1 text-sm text-blue-700" style={{ fontFamily: 'Inter' }}>
              Your emergency contacts will be notified when you request emergency assistance. You
              can toggle notifications for each contact individually.
            </Text>
          </View>
        </View>

        {/* Contact List */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#E63946" />
            </View>
          ) : contacts && contacts.length > 0 ? (
            contacts.map(renderContactCard)
          ) : (
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text
                className="mt-4 text-center text-lg text-gray-400"
                style={{ fontFamily: 'Inter' }}>
                No emergency contacts yet
              </Text>
              <Text
                className="mt-1 text-center text-sm text-gray-400"
                style={{ fontFamily: 'Inter' }}>
                Add contacts who should be notified in emergencies
              </Text>
              <TouchableOpacity
                onPress={openAddModal}
                className="mt-4 rounded-xl bg-primary px-6 py-3">
                <Text className="text-white" style={{ fontFamily: 'Inter' }}>
                  Add Your First Contact
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="h-8" />
        </ScrollView>

        {renderModal()}
      </View>
    </SafeAreaContainer>
  );
}
