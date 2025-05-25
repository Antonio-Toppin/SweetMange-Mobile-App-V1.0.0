import * as SQLite from 'expo-sqlite';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

// Show an alert dialog with a title and message
const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }], { cancelable: true });
};

// Input component with a left icon and optional right icon (e.g., dice for random number)
const InputWithLeftIcon = ({ iconName, placeholder, value, onChangeText, keyboardType = 'default', editable = true, rightIcon, onRightIconPress }) => (
    <View style={styles.inputContainerWithIcon}>
        <View style={styles.leftIconContainer}>
            <MaterialIcons name={iconName} size={24} color="black" />
        </View>
        <TextInput
            placeholder={placeholder}
            style={styles.inputWithLeftIcon}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            editable={editable}
            placeholderTextColor="black"
        />
        {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={{ padding: 8 }}>
                <FontAwesome5 name={rightIcon} size={24} color="#4CAF50" />
            </TouchableOpacity>
        )}
    </View>
);

export default function CustomersScreen() {
    // State for the customer id input
    const [customerId, setCustomerId] = useState('');
    // State for the customer name input
    const [customerName, setCustomerName] = useState('');
    // State for the phone input
    const [phone, setPhone] = useState('');
    // State for the list of customers
    const [customers, setCustomers] = useState([]);
    // State for the customer being edited (null if not editing)
    const [editingId, setEditingId] = useState(null);
    // State for the dice icon to show different icons when pressed
    const [diceIcon, setDiceIcon] = useState('dice');
    // List of FontAwesome5 dice icons
    const diceIcons = [
        'dice-one',
        'dice-two',
        'dice-three',
        'dice-four',
        'dice-five',
        'dice-six',
    ];
    // Ref for scrolling the FlatList
    const flatListRef = useRef(null);
    // Database reference
    const dbRef = useRef(null);

    // Create table if it doesn't exist (runs once)
    const createTables = async () => {
        if (!dbRef.current) {
            dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
        }
        await dbRef.current.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS tblcustomers (
                customer_id TEXT PRIMARY KEY,
                name TEXT,
                phone TEXT
            );
        `);
    };

    // Fetch all customers from the database
    const loadCustomers = async () => {
        if (!dbRef.current) {
            dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
        }
        const allRows = await dbRef.current.getAllAsync('SELECT * FROM tblcustomers ORDER BY customer_id DESC;');
        setCustomers(allRows);
    };

    // Run createTables and loadCustomers on mount
    useEffect(() => {
        const init = async () => {
            await createTables(); // Ensure table is created first
            await loadCustomers();
        };
        init();
    }, []);

    // Validate input fields before saving
    const validateInputs = () => {
        if (!customerId.trim() || !customerName.trim() || !phone.trim()) {
            showAlert('Error', 'All fields are required.');
            return false;
        }
        // Phone number validation: allow digits, spaces, dashes, parentheses, must be at least 7 digits
        const cleanedPhone = phone.replace(/[^0-9]/g, '');
        if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
            showAlert('Error', 'Please enter a valid phone number (at least 7 digits, max 15).');
            return false;
        }
        // Optional: regex for valid phone number format
        const phoneRegex = /^\(?\d{3}\)?[\s-]?\d{3,4}[\s-]?\d{0,4}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            showAlert('Error', 'Phone number format is invalid.');
            return false;
        }
        return true;
    };

    // Add or update a customer in the database
    const handleAddOrUpdate = async () => {
        await createTables(); // Ensure table is created before any mutation
        if (!validateInputs()) {
            return;
        }
        if (!dbRef.current) {
            dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
        }
        const db = dbRef.current;
        try {
            if (!editingId) {
                // Check for duplicate customer id before insert
                const existing = await db.getAllAsync('SELECT * FROM tblcustomers WHERE customer_id = ?;', customerId);
                if (existing && existing.length > 0) {
                    showAlert('Error', 'Customer ID already exists.');
                    return;
                }
            } else {
                // Check for duplicate customer id when editing (but allow if it's the same as the current editingId)
                const existing = await db.getAllAsync('SELECT * FROM tblcustomers WHERE customer_id = ?;', customerId);
                if (existing && existing.length > 0 && customerId !== editingId) {
                    showAlert('Error', 'Customer ID already exists.');
                    return;
                }
            }
            if (editingId) {
                // Update existing customer
                await db.runAsync(
                    'UPDATE tblcustomers SET customer_id = ?, name = ?, phone = ? WHERE customer_id = ?;',
                    customerId, customerName, phone, editingId
                );
            } else {
                // Insert new customer
                await db.runAsync(
                    'INSERT INTO tblcustomers (customer_id, name, phone) VALUES (?, ?, ?);',
                    customerId, customerName, phone
                );
            }
            setEditingId(null);
            setCustomerId('');
            setCustomerName('');
            setPhone('');
            await loadCustomers();
        } catch (error) {
            showAlert('Error', editingId ? 'Failed to update customer.' : 'Failed to add customer.');
        }
    };

    // Start editing a customer (populate fields)
    const handleEdit = (item) => {
        setEditingId(item.customer_id); // Store the customer_id as edit id
        setCustomerId(item.customer_id ? String(item.customer_id) : '');
        setCustomerName(item.name ? String(item.name) : '');
        setPhone(item.phone !== undefined && item.phone !== null ? String(item.phone) : '');
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    };

    // Cancel editing or adding
    const handleCancel = () => {
        if (editingId || customerId || customerName || phone) {
            Alert.alert(
                'Cancel',
                'Are you sure you want to cancel? All entered data will be lost.',
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes',
                        style: 'destructive',
                        onPress: () => {
                            setEditingId(null);
                            setCustomerId('');
                            setCustomerName('');
                            setPhone('');
                        }
                    }
                ]
            );
        } else {
            setEditingId(null);
            setCustomerId('');
            setCustomerName('');
            setPhone('');
        }
    };

    // Delete a single customer with confirmation
    const handleDelete = async (item) => {
        await createTables(); // Ensure table is created before delete
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${item.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!dbRef.current) {
                            dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
                        }
                        const db = dbRef.current;
                        await db.runAsync('DELETE FROM tblcustomers WHERE customer_id = ?;', item.customer_id);
                        // Refresh the customer list
                        loadCustomers();
                        // If currently editing this customer, cancel edit
                        if (editingId === item.customer_id) {
                            setEditingId(null);
                            setCustomerId('');
                            setCustomerName('');
                            setPhone('');
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    // Main customer management UI
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* FlatList displays all customers and includes the add/edit form as header */}
            <FlatList
                ref={flatListRef}
                style={styles.bigList}
                data={customers}
                ListHeaderComponent={
                    <View style={styles.main}>
                        <Text style={styles.title}>Manage Customers</Text>
                        {/* Customer ID input with dice icon for random generation */}
                        <InputWithLeftIcon
                            iconName="numbers"
                            placeholder="Customer ID (e.g. 1234)"
                            value={customerId}
                            onChangeText={text => {
                                if (!editingId) {
                                    setCustomerId(text.replace(/[^0-9]/g, '').slice(0, 4));
                                }
                            }}
                            keyboardType='numeric'
                            editable={!editingId}
                            style={[styles.inputWithLeftIcon, editingId ? { backgroundColor: '#DADADA' } : null]}
                            rightIcon={diceIcon}
                            onRightIconPress={async () => {
                                if (!editingId) {
                                    if (!dbRef.current) {
                                        dbRef.current = await SQLite.openDatabaseAsync('myDatabase.db');
                                    }
                                    const existingCustomers = await dbRef.current.getAllAsync('SELECT customer_id FROM tblcustomers;');
                                    const existingIds = existingCustomers.map(c => String(c.customer_id));
                                    let randomNum;
                                    let attempts = 0;
                                    do {
                                        randomNum = Math.floor(1000 + Math.random() * 9000).toString();
                                        attempts++;
                                    } while (existingIds.includes(randomNum) && attempts < 20);
                                    if (existingIds.includes(randomNum)) {
                                        showAlert('Error', 'Could not generate a unique customer ID.');
                                        return;
                                    }
                                    setCustomerId(randomNum);
                                    let newIcon = diceIcon;
                                    if (diceIcons.length > 1) {
                                        while (newIcon === diceIcon) {
                                            newIcon = diceIcons[Math.floor(Math.random() * diceIcons.length)];
                                        }
                                    }
                                    setDiceIcon(newIcon);
                                }
                            }}
                        />
                        {/* Customer Name input */}
                        <InputWithLeftIcon
                            iconName="drive-file-rename-outline"
                            placeholder="Customer Name (e.g. John Doe)"
                            value={customerName}
                            onChangeText={setCustomerName}
                        />
                        {/* Phone input with formatting */}
                        <InputWithLeftIcon
                            iconName="phone"
                            placeholder="Phone (e.g. (246) 123-4567)"
                            value={phone}
                            onChangeText={(text) => {
                                // Format phone number as (XXX) XXX-XXXX or similar
                                let cleaned = text.replace(/[^0-9]/g, '');
                                let formatted = cleaned;
                                if (cleaned.length > 3 && cleaned.length <= 6) {
                                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
                                } else if (cleaned.length > 6) {
                                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
                                }
                                setPhone(formatted);
                            }}
                            keyboardType="phone-pad"
                        />
                        {/* Add/Edit and Cancel buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.button, { backgroundColor: editingId ? '#FFA500' : '#4CAF50' }]} onPress={handleAddOrUpdate}>
                                <Text style={styles.buttonText}>{editingId ? 'Edit Customer' : 'Add Customer'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#888' }]} onPress={handleCancel}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.horizontalLine} />
                    </View>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: '#888', fontSize: 18 }}>No customers found. Add your first customer!</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={styles.productCard}>
                            {/* Tap to edit customer */}
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleEdit(item)}>
                                <View style={styles.productRow}>
                                    <Text style={styles.productName}>{item?.name}</Text>
                                </View>
                                <Text style={styles.productNumber}>ID: {item?.customer_id}</Text>
                                <Text style={styles.productNumber}>Phone number: {item?.phone}</Text>
                            </TouchableOpacity>
                            {/* Delete customer button */}
                            <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginLeft: 10 }}>
                                <MaterialIcons name="delete" size={28} color="#FE0000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                keyExtractor={(item, index) => (item.customer_id ? item.customer_id.toString() : index.toString())}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );
}

// Styles for CustomersScreen UI elements
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
    inputContainerWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: 'white',
    },
    leftIconContainer: {
        padding: 12,
    },
    inputWithLeftIcon: {
        flex: 1,
        padding: 12,
        color: 'black',
    },
    button: {
        backgroundColor: '#FE4684',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        flex: 1,
        marginHorizontal: 2,
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        marginBottom: 10,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productInfoContainer: {
        flex: 2,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    productName: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#222',
        marginBottom: 2,
    },
    productNumber: {
        fontSize: 15,
        color: '#888',
    },
    productPriceContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    productPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
    },
    bigList: {
        flex: 10,
        paddingTop: 10,
        backgroundColor: '#fff',
    },
    separator: {
        height: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    horizontalLine: {
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        marginVertical: 10,
    },
    enlargedList: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#C0C0C0',
    },
});
