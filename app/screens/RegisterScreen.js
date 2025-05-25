import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { initializeTables, executeUpdate } from '../utils/database';

// Helper to show alert dialogs
const showAlert = (title, message) => {
    Alert.alert(
        title,
        message,
        [
            { text: 'OK', onPress: () => console.log('OK Pressed') },
        ],
        { cancelable: true }
    );
};

// Input component with left icon for form fields
const InputWithLeftIcon = ({ iconName, placeholder, value, onChangeText, secureTextEntry = false }) => {
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
            />
        </View>
    );
};

// RegisterScreen handles user registration and validation
export default function RegisterScreen({ navigation }) {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Initialize tables on component mount
    useEffect(() => {
        initializeTables();
    }, []);

    // Validations for the inputs before saving
    const validateInputs = () => {
        if (!fullname.trim() || !email.trim() || !username.trim() || !password.trim()) {
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

    // Save data using the database helper
    const saveData = async () => {
        if (!validateInputs()) {
            return;
        }

        try {
            await executeUpdate(
                'INSERT INTO tblusers (full_name, email, username, password, is_logged_in) VALUES (?, ?, ?, ?, 0);',
                [fullname, email, username, password]
            );
            
            setFullname('');
            setEmail('');
            setUsername('');
            setPassword('');
            showAlert('Registration Successful', 'Your account has been created successfully!');
            navigation.navigate('Login');
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                showAlert('Error', 'Username already taken. Please choose another.');
            } else {
                showAlert('Error', 'Failed to register user.');
            }
        }
    };

    return (
        <View style={styles.main}>
            {/* Title */}
            <Text style={styles.title}> Register a new account</Text>
            {/* Full Name input */}
            <InputWithLeftIcon
                iconName="person"
                placeholder="Full Name"
                value={fullname}
                onChangeText={(text) => setFullname(text)}
            />
            {/* Email input */}
            <InputWithLeftIcon
                iconName="email"
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => setEmail(text)}
            />
            {/* Username input */}
            <InputWithLeftIcon
                iconName="account-circle"
                placeholder="Username"
                value={username}
                onChangeText={(text) => setUsername(text)}
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
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconContainer}>
                    <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="black"
                    />
                </TouchableOpacity>
            </View>
            {/* Register button */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, {width: '100%'}]} onPress={saveData}>
                    <Text style={styles.buttonText}>Register Account</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.horizontalLine} />
            {/* Link to Login screen */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Do you have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
}

// Styles for RegisterScreen UI elements
const styles = StyleSheet.create({
    main: {
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
    label: {
        fontSize: 16,
        color: 'black',
        marginBottom: 5,
        width: '100%',
        textAlign: 'left'
    },
    input: {
        flex: 1,
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
        fontWeight:'500',
    },
    link: {
        textAlign: 'center',
        marginTop: 20,
        color: '#00000',
    },
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 15,
        columnGap: 6
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
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
    enlargedList: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: "#C0C0C0",
    },
});
