import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screen components
import HomeScreen from './HomeScreen';
import ProductsScreen from './ProductsScreen';
import CustomersScreen from './CustomersScreen';
import OrdersScreen from './OrdersScreen';
import SummaryScreen from './SummaryScreen';

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

// Tabs component manages bottom tab navigation
export default function Tabs({ navigation, route }) {
  // Get userId from route params
  const userId = route?.params?.userId;

  // Settings button in header
  const SettingsButton = () => (
    <TouchableOpacity onPress={() => navigation.navigate('Settings', { userId })} style={{ marginRight: 15 }}>
      <Ionicons name="settings-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );

  // Custom tab bar to rearrange Home tab and style icons
  const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    // Find the Home tab index
    const homeIndex = state.routes.findIndex(route => route.name === 'Home');
    // Copy routes and move Home to index 2 (third tab)
    const tabs = [...state.routes];
    const [homeTab] = tabs.splice(homeIndex, 1);
    tabs.splice(2, 0, homeTab);

    return (
      <SafeAreaView style={{ backgroundColor: '#fff' }} edges={['bottom']}>
        <View style={{ flexDirection: 'row', height: 60 + insets.bottom, backgroundColor: '#fff', elevation: 5, paddingBottom: 10 + insets.bottom }}>
          {tabs.map((route, index) => {
            const { options } = descriptors[route.key];
            // Find the correct focus state by matching the route key
            const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: isFocused ? '#fe4684' : '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: isFocused ? 5 : 0,
                }}>
                  <Ionicons
                    name={
                      route.name === 'Home' ? 'home-outline' :
                      route.name === 'Products' ? 'cube-outline' :
                      route.name === 'Customers' ? 'people-outline' :
                      route.name === 'Place Orders' ? 'cart-outline' :
                      route.name === 'Order Summary' ? 'clipboard-outline' :
                      'alert-circle-outline' // Default icon
                    }
                    size={24}
                    color={isFocused ? '#fff' : 'gray'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    );
  };

  return (
    // Tab navigator with custom tab bar and header
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fe4684',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <SettingsButton />,
      }}
    >
      {/* Pass userId to HomeScreen, other screens as components */}
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} userId={userId} />}
      </Tab.Screen>
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Place Orders" component={OrdersScreen} />
      <Tab.Screen name="Order Summary" component={SummaryScreen} />
    </Tab.Navigator>
  );
}
