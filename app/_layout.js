// Import necessary libraries and screens
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SettingsScreen from './screens/SettingsScreen';
import MyAccountScreen from './screens/MyAccountScreen';
import Tabs from './screens/Tabs';
import AboutScreen from './screens/AboutScreen';

// Create a stack navigator
const Stack = createNativeStackNavigator();

// Main App component with navigation stack
export default function App() {
  return (
    // Stack navigator with custom header and defined screens
    <Stack.Navigator
      initialRouteName="SplashScreen"
      screenOptions={{
        headerStyle: { backgroundColor: '#FE4684' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
        // Custom back button styling
        headerBackImage: () => (
          <View style={styles.backButtonContainer}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </View>
        ),
      }}
    >
      {/* App screens */}
      <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="MyAccount" component={MyAccountScreen} />
    </Stack.Navigator>
  );
}

// Styles for custom back button
const styles = StyleSheet.create({
  backButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FE4684',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

