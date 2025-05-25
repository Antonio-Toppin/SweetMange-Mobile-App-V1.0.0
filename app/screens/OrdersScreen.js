import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { initializeTables, executeQuery, executeUpdate, executeTransaction, closeDatabase } from '../utils/database';

// Show an alert dialog with a title and message
const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }], { cancelable: true });
};

// Input component with a left icon and optional right icon
const InputWithLeftIcon = ({ iconName, placeholder, value, onChangeText, keyboardType = 'default', rightIcon, onRightIconPress }) => (
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
            placeholderTextColor="black"
        />
        {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={{ padding: 8 }}>
                <FontAwesome5 name={rightIcon} size={24} color="#4CAF50" />
            </TouchableOpacity>
        )}
    </View>
);

// OrdersScreen manages order creation, product selection, and displays order list
export default function OrdersScreen() {
    const [orderDate, setOrderDate] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [productId, setProductId] = useState('');
    const [productQty, setProductQty] = useState('');
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [orderNumbers, setOrderNumbers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orderProducts, setOrderProducts] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [tempOrderProducts, setTempOrderProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const mountedRef = useRef(true);
    const flatListRef = useRef(null);

    // Reset all state
    const resetState = () => {
        console.log('Resetting state...');
        setOrderDate('');
        setCustomerId('');
        setProductId('');
        setProductQty('');
        setOrders([]);
        setCustomers([]);
        setOrderNumbers([]);
        setProducts([]);
        setOrderProducts([]);
        setShowDatePicker(false);
        setCurrentOrderId(null);
        setTempOrderProducts([]);
        setIsLoading(true);
    };

    // Initialize database
    useEffect(() => {
        console.log('Initializing database...');
        let isInitializing = true;

        const initDb = async () => {
            try {
                if (!isInitializing) return;
                console.log('Starting database initialization...');
                
                resetState();
                
                // Initialize tables with retry
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                    try {
                        await initializeTables();
                        break;
                    } catch (error) {
                        console.error(`Database initialization attempt ${retryCount + 1} failed:`, error);
                        retryCount++;
                        if (retryCount === maxRetries) throw error;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    }
                }
                
                if (!isInitializing) return;
                console.log('Database tables initialized, waiting for connection...');
                
                // Test database connection with retry
                retryCount = 0;
                while (retryCount < maxRetries) {
                    try {
                        await executeQuery('SELECT 1');
                        break;
                    } catch (error) {
                        console.error(`Database connection test attempt ${retryCount + 1} failed:`, error);
                        retryCount++;
                        if (retryCount === maxRetries) throw error;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                if (!isInitializing) return;
                console.log('Database connection successful, loading initial data...');
                
                // Load initial data
                await loadInitialData();
                
                console.log('Initial data loaded successfully');
            } catch (error) {
                console.error('Database initialization error:', error);
                if (isInitializing && mountedRef.current) {
                    showAlert('Error', 'Failed to initialize database. Please try again.');
                }
            } finally {
                if (isInitializing && mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        initDb();

        return () => {
            console.log('Cleaning up initialization...');
            isInitializing = false;
            mountedRef.current = false;
        };
    }, []);

    // Load initial data
    const loadInitialData = async () => {
        if (!mountedRef.current) {
            console.log('Component unmounted, skipping initial data load');
            return;
        }

        try {
            console.log('Loading initial data...');
            
            const customersData = await executeQuery('SELECT * FROM tblcustomers ORDER BY name ASC;');
            if (mountedRef.current) {
                console.log(`Loaded ${customersData?.length || 0} customers`);
                setCustomers(customersData || []);
            }

            const productsData = await executeQuery('SELECT * FROM tblproducts ORDER BY name ASC;');
            if (mountedRef.current) {
                console.log(`Loaded ${productsData?.length || 0} products`);
                setProducts(productsData || []);
            }

            const ordersData = await executeQuery('SELECT * FROM tblorders ORDER BY order_number DESC;');
            if (mountedRef.current) {
                console.log(`Loaded ${ordersData?.length || 0} orders`);
                setOrders(ordersData || []);
            }

            const orderNumbersData = await executeQuery('SELECT order_number FROM tblorders ORDER BY order_number DESC;');
            if (mountedRef.current) {
                console.log(`Loaded ${orderNumbersData?.length || 0} order numbers`);
                setOrderNumbers((orderNumbersData || []).map(row => row.order_number));
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            if (mountedRef.current) {
                showAlert('Error', 'Failed to load initial data.');
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    // Refresh customer and product lists when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            console.log('Screen focused, refreshing lists...');
            let isRefreshing = true;

            const refreshLists = async () => {
                if (!isRefreshing || !mountedRef.current) return;
                
                try {
                    // Test database connection first
                    await executeQuery('SELECT 1');
                    
                    // Refresh only customers and products
                    const customersData = await executeQuery('SELECT * FROM tblcustomers ORDER BY name ASC;');
                    if (isRefreshing && mountedRef.current) {
                        console.log(`Refreshed ${customersData?.length || 0} customers`);
                        setCustomers(customersData || []);
                    }

                    const productsData = await executeQuery('SELECT * FROM tblproducts ORDER BY name ASC;');
                    if (isRefreshing && mountedRef.current) {
                        console.log(`Refreshed ${productsData?.length || 0} products`);
                        setProducts(productsData || []);
                    }
                } catch (error) {
                    console.error('Error refreshing lists:', error);
                    // If database is closed, try to reinitialize
                    if (error.message.includes('Access to closed resource')) {
                        console.log('Database connection closed, attempting to reinitialize...');
                        try {
                            await initializeTables();
                            // Retry the refresh after reinitializing
                            const customersData = await executeQuery('SELECT * FROM tblcustomers ORDER BY name ASC;');
                            const productsData = await executeQuery('SELECT * FROM tblproducts ORDER BY name ASC;');
                            if (isRefreshing && mountedRef.current) {
                                setCustomers(customersData || []);
                                setProducts(productsData || []);
                            }
                        } catch (reinitError) {
                            console.error('Failed to reinitialize database:', reinitError);
                            showAlert('Error', 'Failed to refresh data. Please try again.');
                        }
                    }
                }
            };

            refreshLists();

            return () => {
                console.log('Cleaning up refresh...');
                isRefreshing = false;
            };
        }, [])
    );

    // Fetch products for the current order
    const loadOrderProducts = async (orderNum) => {
        if (!orderNum || !mountedRef.current) { 
            setOrderProducts([]); 
            return; 
        }

        try {
            // Test database connection
            await executeQuery('SELECT 1');
            
            const allRows = await executeQuery(
                'SELECT op.*, p.name, p.price FROM tblorder_products op JOIN tblproducts p ON op.product_number = p.product_number WHERE op.order_number = ?;',
                [orderNum]
            );
            if (mountedRef.current) {
                setOrderProducts(allRows || []);
            }
        } catch (error) {
            console.error('Error loading order products:', error);
            if (mountedRef.current) {
                showAlert('Error', 'Failed to load order products.');
            }
        }
    };

    // Fetch order products if currentOrderId changes
    useEffect(() => {
        if (currentOrderId && mountedRef.current) {
            loadOrderProducts(currentOrderId);
        }
    }, [currentOrderId]);

    // Save the order and its products
    const handleAddOrder = async () => {
        if (!validateInputs()) {
            return;
        }

        if (tempOrderProducts.length === 0) {
            showAlert('Error', 'Please add at least one product to the order.');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Starting order creation...');

            // Test database connection first
            await executeQuery('SELECT 1');
            console.log('Database connection verified');

            const totalPrice = tempOrderProducts.reduce((sum, item) => sum + item.subtotal, 0);
            console.log('Calculated total price:', totalPrice);

            // Insert order
            const result = await executeUpdate(
                'INSERT INTO tblorders (date, customer_id, total_price) VALUES (?, ?, ?);',
                [orderDate, customerId, totalPrice]
            );
            console.log('Order inserted, order number:', result.lastInsertRowId);

            const orderNumber = result.lastInsertRowId;

            // Insert order products
            const queries = tempOrderProducts.map(item => ({
                query: 'INSERT INTO tblorder_products (order_number, product_number, qty, subtotal) VALUES (?, ?, ?, ?);',
                params: [orderNumber, item.product_number, item.qty, item.subtotal]
            }));

            console.log('Inserting order products...');
            await executeTransaction(queries);
            console.log('Order products inserted successfully');

            // Reset form
            resetState();

            // Refresh data
            console.log('Refreshing data...');
            await loadInitialData();
            
        } catch (error) {
            console.error('Error adding order:', error);
            showAlert('Error', 'Failed to add order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Validate input fields before saving
    const validateInputs = () => {
        console.log('Validating inputs...');
        console.log('Order date:', orderDate);
        console.log('Customer ID:', customerId);
        console.log('Temp products:', tempOrderProducts);

        if (!orderDate.trim() || !customerId.trim()) {
            showAlert('Error', 'Date and Customer are required.');
            return false;
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(orderDate)) {
            showAlert('Error', 'Date must be in YYYY-MM-DD format.');
            return false;
        }

        // Validate customer exists
        if (!customers.some(c => c.customer_id === customerId)) {
            showAlert('Error', 'Selected customer is not valid.');
            return false;
        }

        // Validate products
        for (const item of tempOrderProducts) {
            if (!products.some(p => p.product_number === item.product_number)) {
                showAlert('Error', 'One or more products are not valid.');
                return false;
            }
        }

        console.log('Input validation successful');
        return true;
    };

    // Add product to temporary order
    const handleAddProduct = () => {
        console.log('Adding product to order...');
        console.log('Product ID:', productId);
        console.log('Quantity:', productQty);

        if (!orderDate.trim() || !customerId.trim() || !productId || !productQty || isNaN(Number(productQty)) || Number(productQty) <= 0) {
            showAlert('Error', 'All fields are required and quantity must be valid.');
            return;
        }

        const prod = products.find(p => p.product_number === productId);
        if (!prod) {
            showAlert('Error', 'Product not found.');
            return;
        }

        const subtotal = prod.price * Number(productQty);
        const newProduct = {
            product_number: prod.product_number,
            name: prod.name,
            price: prod.price,
            qty: Number(productQty),
            subtotal: subtotal
        };

        console.log('Adding product:', newProduct);
        setTempOrderProducts([...tempOrderProducts, newProduct]);
        setProductId('');
        setProductQty('');
    };

    // Delete an order and its products
    const handleDelete = async (item) => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await executeUpdate('DELETE FROM tblorder_products WHERE order_number = ?;', [item.order_number]);
                            await executeUpdate('DELETE FROM tblorders WHERE order_number = ?;', [item.order_number]);
                            await loadOrders();
                            await loadOrderNumbers();
                        } catch (error) {
                            showAlert('Error', 'Failed to delete order.');
                        }
                    }
                }
            ]
        );
    };

    // Helper to handle date change
    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            setOrderDate(`${year}-${month}-${day}`);
        }
    };

    // Calculate total price for tempOrderProducts
    const totalPrice = tempOrderProducts.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // Remove a product from the temporary order list
    const handleRemoveProduct = (productNumber) => {
        Alert.alert(
            'Remove Product',
            'Are you sure you want to remove this product from the order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => {
                        setTempOrderProducts(tempOrderProducts.filter(item => item.product_number !== productNumber));
                    }
                }
            ]
        );
    };

    // Reset form state with confirmation
    const handleCancel = () => {
        if (tempOrderProducts.length > 0 || orderDate || customerId || productId || productQty) {
            Alert.alert(
                'Cancel Order',
                'Are you sure you want to cancel this order? All entered data will be lost.',
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes',
                        style: 'destructive',
                        onPress: () => {
                            setOrderDate('');
                            setCustomerId('');
                            setProductId('');
                            setProductQty('');
                            setTempOrderProducts([]);
                            setCurrentOrderId(null);
                        }
                    }
                ]
            );
        } else {
            setOrderDate('');
            setCustomerId('');
            setProductId('');
            setProductQty('');
            setTempOrderProducts([]);
            setCurrentOrderId(null);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading data...</Text>
                </View>
            ) : (
                // Main order management UI
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    {/* FlatList for displaying orders and order form as header */}
                    <FlatList
                        ref={flatListRef}
                        style={styles.bigList}
                        data={orders}
                        ListHeaderComponent={
                            <View style={styles.main}>
                                <Text style={styles.title}>Add an Order</Text>
                                {/* Date Picker */}
                                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                    <InputWithLeftIcon
                                        iconName="date-range"
                                        placeholder="Date (YYYY-MM-DD)"
                                        value={orderDate}
                                        onChangeText={() => {}}
                                        keyboardType="default"
                                        rightIcon="calendar"
                                        onRightIconPress={() => setShowDatePicker(true)}
                                    />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={orderDate ? new Date(orderDate) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                    />
                                )}
                                {/* Customer Dropdown */}
                                <View style={styles.inputContainerWithIcon}>
                                    <View style={styles.leftIconContainer}>
                                        <MaterialIcons name="person" size={24} color="black" />
                                    </View>
                                    <Picker
                                        selectedValue={customerId}
                                        style={{ flex: 1, color: 'black' }}
                                        onValueChange={(itemValue) => setCustomerId(itemValue)}
                                    >
                                        <Picker.Item label="Select Customer" value="" />
                                        {customers.map((cust) => (
                                            <Picker.Item key={cust.customer_id} label={cust.name} value={cust.customer_id} />
                                        ))}
                                    </Picker>
                                </View>
                                
                                {/* Product and Quantity Section */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <View style={[styles.inputContainerWithIcon, { flex: 2, marginRight: 5 }]}> 
                                        <View style={styles.leftIconContainer}>
                                            <MaterialIcons name="inventory" size={24} color="black" />
                                        </View>
                                        <Picker
                                            selectedValue={productId}
                                            style={{ flex: 1, color: 'black' }}
                                            onValueChange={(itemValue) => setProductId(itemValue)}
                                        >
                                            <Picker.Item label="Select Product" value="" />
                                            {products.map((prod) => (
                                                <Picker.Item key={prod.product_number} label={prod.name} value={prod.product_number} />
                                            ))}
                                        </Picker>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <InputWithLeftIcon
                                            iconName="format-list-numbered"
                                            placeholder="Qty"
                                            value={productQty}
                                            onChangeText={setProductQty}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                                    <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50', flex: 1, marginTop: 0 }]} onPress={handleAddProduct}>
                                        <Text style={styles.buttonText}>Add Product</Text>
                                    </TouchableOpacity>
                                </View>
                                {/* List of products for this order */}
                                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 5 }}>Products in Order</Text>
                                <FlatList
                                    data={tempOrderProducts}
                                    keyExtractor={(item, index) => (item.product_number ? item.product_number.toString() : index.toString())}
                                    renderItem={({ item }) => (
                                        <View style={styles.productCard}>
                                            <View style={{ flex: 2 }}>
                                                <Text style={styles.productName}>{item.name}</Text>
                                                <Text style={styles.productNumber}>Qty: {item.qty}</Text>
                                            </View>
                                            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                                <Text style={styles.productPrice}>Subtotal</Text>
                                                <Text style={[styles.productPrice, { fontSize: 16, color: '#4CAF50' }]}>${parseFloat(item.subtotal).toFixed(2)}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => handleRemoveProduct(item.product_number)} style={{ marginLeft: 12 }}>
                                                <FontAwesome5 name="trash" size={20} color="#FE0000" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    ListEmptyComponent={<Text style={{ color: '#888', marginBottom: 10 }}>No products added yet.</Text>}
                                    style={{ marginBottom: 10 }}
                                />
                                {/* Total Price Display */}
                                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'right' }}>
                                    Total: ${totalPrice.toFixed(2)}
                                </Text>
                            </View>
                        }

                        

                    />
                    <View style={{ flexDirection: 'row', marginBottom: 20, marginHorizontal: 20 }}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50', flex: 1, marginTop: 0 }]} onPress={handleAddOrder}>
                            <Text style={styles.buttonText}>Add Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#888', flex: 1, marginTop: 0, marginLeft: 10 }]} onPress={handleCancel}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

// Styles for OrdersScreen UI elements
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});
