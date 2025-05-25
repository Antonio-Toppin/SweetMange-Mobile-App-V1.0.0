// Import React and necessary hooks/components
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';

// SplashScreen component displays a splash image and navigates to Welcome after a delay
export default function SplashScreen({ navigation }) {
    // State to control splash visibility
    const [showSplash, setShowSplash] = useState(true);

    // useEffect sets a timer to hide splash and navigate
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
            navigation.replace('Welcome'); // Navigate to Welcome screen after splash
        }, 1500);

        return () => clearTimeout(timer); // Cleanup timer on unmount
    }, [navigation]);

    // Render splash image if showSplash is true
    if (showSplash) {
        return (
            <View style={styles.splashContainer}>
                <Image
                    source={require('../assets/TaylorsTreats_Logo-Tran.png')}
                    style={styles.splashImage}
                />
            </View>
        );
    }

    return null; // Splash screen will navigate away after timeout
}

// Styles for splash screen container and image
const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        backgroundColor: 'pink',
        justifyContent: 'center',
        alignItems: 'center',
    },
    splashImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
});
