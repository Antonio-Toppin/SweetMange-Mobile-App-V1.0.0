import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../utils/database';
import * as Updates from 'expo-updates';

// SettingsScreen provides account, help, and logout options
const SettingsScreen = ({ navigation, route }) => {
  // Get userId from route params (passed from Tabs)
  const userId = route?.params?.userId;

  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const toggleDarkMode = () => setDarkModeEnabled((prev) => !prev);

  // Handle hardware back button on Android
  React.useEffect(() => {
    const backAction = () => {
      // Prevent going back to login without authentication
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);

  // Handle app restart
  const restartApp = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error restarting app:', error);
      // Fallback to navigation reset if update reload fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  // Handle logout logic and navigation
  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await logout();
            await restartApp();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout properly. Please try again.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    // Main settings UI
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Account section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Account</Text>
          <TouchableOpacity 
            style={[styles.settingItem, isLoggingOut && styles.disabledItem]} 
            onPress={() => navigation.navigate('MyAccount', { userId })}
            disabled={isLoggingOut}
          >
            <MaterialIcons name="manage-accounts" size={24} color={isLoggingOut ? '#ccc' : 'black'} style={styles.leftIcon} />
            <Text style={[styles.settingText, isLoggingOut && styles.disabledText]}>My Account</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.settingItemRow}>
            <MaterialIcons name="dark-mode" size={24} color={isLoggingOut ? '#ccc' : 'black'} style={styles.leftIcon} />
            <View style={styles.textContainer}>
              <Text style={[styles.settingText, isLoggingOut && styles.disabledText]}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              thumbColor={darkModeEnabled ? '#FE4684' : '#cccccc'}
              style={styles.switch}
              disabled={isLoggingOut}
            />
          </View>
        </View>

        {/* Help and Policy section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Help and Policy</Text>
          <TouchableOpacity style={[styles.settingItem, isLoggingOut && styles.disabledItem]} disabled={isLoggingOut}>
            <MaterialIcons name="help-outline" size={24} color={isLoggingOut ? '#ccc' : 'black'} style={styles.leftIcon} />
            <Text style={[styles.settingText, isLoggingOut && styles.disabledText]}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, isLoggingOut && styles.disabledItem]} disabled={isLoggingOut}>
            <MaterialIcons name="gavel" size={24} color={isLoggingOut ? '#ccc' : 'black'} style={styles.leftIcon} />
            <Text style={[styles.settingText, isLoggingOut && styles.disabledText]}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, isLoggingOut && styles.disabledItem]} disabled={isLoggingOut}>
            <MaterialIcons name="policy" size={24} color={isLoggingOut ? '#ccc' : 'black'} style={styles.leftIcon} />
            <Text style={[styles.settingText, isLoggingOut && styles.disabledText]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, isLoggingOut && styles.disabledItem]} 
            onPress={() => navigation.navigate('About')}
            disabled={isLoggingOut}
          >
            <MaterialIcons name="info-outline" size={24} color={isLoggingOut ? '#ccc' : 'black'} style={styles.leftIcon} />
            <Text style={[styles.settingText, isLoggingOut && styles.disabledText]}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Logout section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={[styles.settingItem, isLoggingOut && styles.disabledItem]} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <MaterialIcons name="logout" size={24} color={isLoggingOut ? '#ccc' : 'red'} style={styles.leftIcon} />
            <Text style={[styles.settingText, styles.logoutText, isLoggingOut && styles.disabledText]}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles for SettingsScreen UI elements
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  leftIcon: {
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutText: {
    color: 'black',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#ccc',
  },
});

export default SettingsScreen;