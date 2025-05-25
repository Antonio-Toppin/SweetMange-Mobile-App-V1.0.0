import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { initializeTables, executeQuery } from '../utils/database';

// HomeScreen displays a dashboard with product, customer, and order counts
export default function HomeScreen({ userId }) {
  // State for dashboard counts and user name
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [userName, setUserName] = useState('');

  // Fetch product count from the table tblproducts
  const fetchProductCount = async () => {
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM tblproducts;');
      setTotalProducts(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to fetch product count:', error);
    }
  };

  // Fetch customer count from the table tblcustomers
  const fetchCustomerCount = async () => {
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM tblcustomers;');
      setTotalCustomers(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to fetch customer count:', error);
    }
  };

  // Fetch order count from the table tblorders
  const fetchOrderCount = async () => {
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM tblorders;');
      setTotalOrders(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to fetch order count:', error);
    }
  };

  // Fetch logged-in user's name
  const fetchUserName = async () => {
    try {
      if (!userId) return;
      const result = await executeQuery('SELECT full_name FROM tblusers WHERE user_id = ?;', [userId]);
      setUserName(result[0]?.full_name || '');
    } catch (error) {
      setUserName('');
    }
  };

  // On mount, initialize tables and fetch all dashboard data
  useEffect(() => {
    const init = async () => {
      await initializeTables();
      await fetchProductCount();
      await fetchCustomerCount();
      await fetchOrderCount();
      await fetchUserName();
    };
    init();
  }, [userId]);

  // Refresh dashboard counts when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const fetchAll = async () => {
        await fetchProductCount();
        await fetchCustomerCount();
        await fetchOrderCount();
      };
      fetchAll();
    }, [])
  );

  // Widget component for dashboard stats
  const Widget = ({ icon, title, count, color }) => (
    <View style={[styles.widgetContainer, { backgroundColor: '#FBFBFB', padding: 18 }]}>
      <View style={[styles.widgetIconContainer, { backgroundColor: `${color}33`, width: 50, height: 50 }]}>
        <MaterialIcons name={icon} size={32} color={color} />
      </View>
      <View style={styles.widgetTextContainer}>
        <Text style={[styles.widgetTitle, { fontSize: 16 }]}>{title}</Text>
        <Text style={[styles.widgetCount, { fontSize: 24 }]}>{count}</Text>
      </View>
    </View>
  );

  // Main dashboard UI
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeMessage}>Welcome,</Text>
      <Text style={styles.userName}>{userName ? userName : 'User'}!</Text>
      <Widget icon="inventory" title="Total Products" count={totalProducts} color="#4CAF50" />
      <Widget icon="people" title="Total Customers" count={totalCustomers} color="#2196F3" />
      <Widget icon="assignment" title="Total Orders" count={totalOrders} color="#FF9800" />
    </View>
  );
}

// Styles for HomeScreen UI elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeMessage: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'left',
  },
  userName: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    color: '#fe4684',
  },
  widgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  widgetIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  widgetTextContainer: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  widgetCount: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
});
