import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

// AboutScreen displays app information, version, and features
const AboutScreen = () => {
  return (
    <ScrollView style={styles.container}> 
   
      <View style={styles.headerContainer}>
        <Text style={styles.title}>About This App</Text>
      </View>
      {/* Overview section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.sectionText}>
          Sweet Manage is a modern app for managing orders, inventory, and customer interactions for small businesses. Easily track products, customers, and orders with a user-friendly interface and secure authentication. Designed for efficiency, reliability, and growth.
        </Text>
      </View>
      {/* Version section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Version</Text>
        <Text style={styles.sectionText}>1.0.0</Text>
      </View>
      {/* Features section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.sectionText}>• Easily add, edit, or remove products and customers</Text>
        <Text style={styles.sectionText}>• Place new orders and view detailed order summaries</Text>
        <Text style={styles.sectionText}>• Instantly search and update customer details</Text>
        <Text style={styles.sectionText}>• Unique ID generation for products and customers</Text>
        <Text style={styles.sectionText}>• Simple, modern design for a great user experience</Text>
        <Text style={styles.sectionText}>• All your data is stored safely on your device</Text>
        <Text style={styles.sectionText}>• Optional dark mode for comfortable viewing at night</Text>
      </View>
    </ScrollView>
  );
};

// Styles for AboutScreen UI elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FE4684',
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
});

export default AboutScreen;