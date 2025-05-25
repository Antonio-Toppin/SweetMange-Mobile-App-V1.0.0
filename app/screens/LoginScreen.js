import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { initializeTables, executeQuery, executeUpdate, closeDatabase, logout } from '../utils/database';
import * as Updates from 'expo-updates';

// Input component with left icon for form fields
const InputWithLeftIcon = ({ iconName, placeholder, value, onChangeText, secureTextEntry = false, disabled = false }) => {
    return (
        <View style={styles.inputContainerWithIcon}>
            <TouchableOpacity style={styles.leftIconContainer}>
                <MaterialIcons name={iconName} size={24} color="black" />
            </TouchableOpacity>
            <TextInput
                placeholder={placeholder}
                style={styles.inputWithLeftIcon}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="black"
                disabled={disabled}
            />
        </View>
    );
};

// LoginScreen handles user authentication and navigation
export default function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize tables on component mount
    useEffect(() => {
        const init = async () => {
            try {
                setIsLoading(true);
                await closeDatabase(); // Ensure clean state
                await initializeTables();
            } catch (error) {
                console.error('Error initializing database:', error);
                showAlert('Error', 'Failed to initialize database. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        init();
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

    // Authenticate user and update login status
    const authenticateUser = async (username, password) => {
        try {
            // Ensure database is initialized
            await initializeTables();
            
            // Check credentials
            const result = await executeQuery(
                'SELECT * FROM tblusers WHERE username = ? AND password = ?',
                [username, password]
            );

            if (result.length > 0) {
                // Update login status
                await executeUpdate(
                    'UPDATE tblusers SET is_logged_in = 0;' +
                    'UPDATE tblusers SET is_logged_in = 1 WHERE username = ?;',
                    [username]
                );
                return result[0]; // Return user object
            }
            return null;
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    };

    // Handle login button press
    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Both fields are required.');
            return;
        }

        try {
            setIsLoading(true);
            const user = await authenticateUser(username, password);
            if (user) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Tabs', params: { userId: user.user_id } }],
                });
            } else {
                Alert.alert('Error', 'Invalid username or password.');
            }
        } catch (error) {
            console.error('Login Error:', error);
            Alert.alert('Error', 'An error occurred while logging in.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await logout();
            await restartApp();
        } catch (error) {
            console.error('Logout Error:', error);
            Alert.alert('Error', 'An error occurred while logging out.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Title */}
            <Text style={styles.title}>Login</Text>
            {/* Username input */}
            <InputWithLeftIcon
                iconName="person"
                placeholder="Username"
                value={username}
                onChangeText={(text) => setUsername(text)}
                disabled={isLoading}
            />
            {/* Password input with show/hide toggle */}
            <View style={styles.inputContainerWithIcon}>
                <TouchableOpacity style={styles.leftIconContainer}>
                    <Ionicons name="lock-closed" size={24} color="black" />
                </TouchableOpacity>
                <TextInput
                    placeholder="Password"
                    style={styles.inputWithLeftIcon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="black"
                    disabled={isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconContainer}>
                    <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="black"
                    />
                </TouchableOpacity>
            </View>
            {/* Login button */}
            <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>{isLoading ? 'Loading...' : 'Login'}</Text>
            </TouchableOpacity>
            <View style={styles.horizontalLine} />
            {/* Link to Register screen */}
            <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
            >
                <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

// Styles for LoginScreen UI elements
const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 20,
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        marginBottom: 30,
        textAlign: 'left',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        color: "black",
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        color: "black",
    },
    iconContainer: {
        padding: 12,
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
     link: {
        textAlign: 'center',
        marginTop: 20,
        color: '#00000',
    },
     inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        color: "black",
    }, 
    icon: {
        position: 'absolute',
        left: 10,
    },
     inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        paddingLeft: 40,
    },
    leftIcon: {
        position: 'absolute',
        left: 10,
    },
     inputContainerWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
    },
    leftIconContainer: {
        padding: 12,
    },
    inputWithLeftIcon: {
        flex: 1,
        padding: 12,
        color: "black",
    },
  
   
    horizontalLine: {
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        marginVertical: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
});