import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// MyAccountScreen allows the user to view and update their account details
const MyAccountScreen = ({ navigation, route, userId: propUserId }) => {
  // Get userId from prop or route params
  const userId = propUserId || route?.params?.userId;
  // State for user data and form fields
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dbRef = useRef(null);

  // Create users table if it doesn't exist
  const createUsersTable = async () => {
    if (!dbRef.current) {
      dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
    }
    await dbRef.current.execAsync(`
      CREATE TABLE IF NOT EXISTS tblusers (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT,
        username TEXT UNIQUE,
        password TEXT,
        is_logged_in INTEGER DEFAULT 0
      );
    `);
  };

  // Fetch user data on mount or when userId changes
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      await createUsersTable(); // Ensure table exists before query
      if (!dbRef.current) {
        dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
      }
      const db = dbRef.current;
      const users = await db.getAllAsync('SELECT * FROM tblusers WHERE user_id = ? LIMIT 1;', userId);
      if (users.length > 0) {
        setUser(users[0]);
        setFullName(users[0].full_name);
        setEmail(users[0].email);
        setUsername(users[0].username);
        setPassword(users[0].password);
      }
    };
    fetchUser();
  }, [userId]);

  // Show alert helper
  const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }], { cancelable: true });
  };

  // Input validation similar to RegisterScreen
  const validateInputs = () => {
    if (!fullName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      showAlert('Error', 'All fields are required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('Error', 'Please enter a valid email address.');
      return false;
    }
    if (password.includes(' ')) {
      showAlert('Error', 'Password cannot contain spaces.');
      return false;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  // Save updated account details
  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }
    await createUsersTable(); // Ensure table exists before update
    if (!dbRef.current) {
      dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
    }
    const db = dbRef.current;
    try {
      // Check for username uniqueness (exclude current user)
      const usersWithSameUsername = await db.getAllAsync('SELECT user_id FROM tblusers WHERE username = ? AND user_id != ?;', username, user.user_id);
      if (usersWithSameUsername.length > 0) {
        showAlert('Error', 'Username already taken. Please choose another.');
        return;
      }
      await db.runAsync(
        'UPDATE tblusers SET full_name = ?, email = ?, username = ?, password = ? WHERE user_id = ?;',
        fullName, email, username, password, user.user_id
      );
      Alert.alert('Success', 'Account updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update account.');
    }
  };

  // Show loading state if user data is not loaded
  if (!user) {
    return (
      <View style={styles.container}><Text>Loading...</Text></View>
    );
  }

  // Render account edit form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit My Account</Text>
      {/* Full Name input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="person" size={22} color="black" style={styles.leftIcon} />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="black"
        />
      </View>
      {/* Email input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={22} color="black" style={styles.leftIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="black"
        />
      </View>
      {/* Username input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="person-outline" size={22} color="black" style={styles.leftIcon} />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="black"
        />
      </View>
      {/* Password input with show/hide toggle */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={22} color="black" style={styles.leftIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="black"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{padding: 8}}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="black" />
        </TouchableOpacity>
      </View>
      {/* Save button */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles for MyAccountScreen UI elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FE4684',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    paddingLeft: 10,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    color: 'black',
  },
  button: {
    backgroundColor: '#FE4684',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default MyAccountScreen;
