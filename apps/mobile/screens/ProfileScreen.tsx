import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { darkTheme, lightTheme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSave = () => {
    // Here you would typically make an API call to update the user's information
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Personal Information
          </Text>
          {isEditing ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Name</Text>
                <Text style={[styles.input, { color: theme.text }]}>
                  {editedUser.name}
                </Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                <Text style={[styles.input, { color: theme.text }]}>
                  {editedUser.email}
                </Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
                <Text style={[styles.input, { color: theme.text }]}>
                  {editedUser.phone}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>Name:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user?.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Email:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user?.email}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Phone:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user?.phone}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Preferences
          </Text>
          <View style={styles.preferenceRow}>
            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDarkMode ? theme.primary : theme.border}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isEditing ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.error }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  preferenceLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
