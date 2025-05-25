import React from 'react';
import { ImageBackground, Text, TouchableOpacity, StyleSheet, View, Image } from 'react-native';

// WelcomeScreen displays the app's welcome UI and navigates to Register
export default function WelcomeScreen({ navigation }) {
    return (
        // Background image for welcome screen
        <ImageBackground source={require('../assets/startup_background.jpg')}
            style={styles.background}>
            {/* Logo section */}
            <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <Image source={require('../assets/TaylorsTreats_Logo-Tran.png')} style={styles.logo} />
                </View>
            </View>
            {/* Title and description */}
            <Text style={styles.title}>Welcome to Sweet Manage</Text>
            <Text style={styles.description}>
                Streamline the management of orders, inventory, and customer interactions with our app.
            </Text>
            {/* Get Started button navigates to Register */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Register')}               
                >
                <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
};

// Styles for WelcomeScreen UI elements
const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logoContainer: {
        position: 'absolute',
        top: 50,
        alignItems: 'center',
    },
    logoCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    description: {
        fontSize: 18,
        color: 'white',
        marginBottom: 40,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    button: {
        backgroundColor: '#A62E56',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
