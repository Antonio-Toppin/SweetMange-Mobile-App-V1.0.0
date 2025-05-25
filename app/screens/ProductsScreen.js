import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { initializeTables, executeQuery, executeUpdate } from '../utils/database';

// Show an alert dialog with a title and message
const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }], { cancelable: true });
};

// InputWithLeftIcon: input field with left icon and optional right icon (e.g., dice)
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

// ProductsScreen manages product CRUD operations and displays product list
export default function ProductsScreen() {
    // State for the product number input
    const [productNumber, setProductNumber] = useState('');
    // State for the product name input
    const [name, setName] = useState('');
    // State for the price input
    const [price, setPrice] = useState('');
    // State for the list of products
    const [products, setProducts] = useState([]);
    // State for the product being edited (null if not editing)
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

    // Initialize tables and load products on mount
    useEffect(() => {
        const init = async () => {
            await initializeTables();
            await loadProducts();
        };
        init();
    }, []);

    // Fetch all products from the database
    const loadProducts = async () => {
        const allRows = await executeQuery('SELECT * FROM tblproducts ORDER BY product_number DESC;');
        setProducts(allRows);
    };

    // Validate input fields before saving
    const validateInputs = () => {
        if (!productNumber.trim() || !name.trim() || !price.trim()) {
            showAlert('Error', 'All fields are required.');
            return false;
        }
        if (isNaN(parseFloat(price))) {
            showAlert('Error', 'Price must be a number.');
            return false;
        }
        return true;
    };

    // Add or update a product in the database
    const handleAddOrUpdate = async () => {
        if (!validateInputs()) {
            return;
        }

        try {
            if (!editingId) {
                // Check for duplicate product number before insert
                const existing = await executeQuery('SELECT * FROM tblproducts WHERE product_number = ?;', [productNumber]);
                if (existing && existing.length > 0) {
                    showAlert('Error', 'Product number already exists.');
                    return;
                }
            }

            if (editingId) {
                // Update existing product
                await executeUpdate(
                    'UPDATE tblproducts SET product_number = ?, name = ?, price = ? WHERE product_number = ?;',
                    [productNumber, name, parseFloat(price), editingId]
                );
            } else {
                // Insert new product
                await executeUpdate(
                    'INSERT INTO tblproducts (product_number, name, price) VALUES (?, ?, ?);',
                    [productNumber, name, parseFloat(price)]
                );
            }

            setEditingId(null);
            setProductNumber('');
            setName('');
            setPrice('');
            await loadProducts();
        } catch (error) {
            showAlert('Error', editingId ? 'Failed to update product.' : 'Failed to add product.');
        }
    };

    // Start editing a product (populate fields)
    const handleEdit = (item) => {
        setEditingId(item.product_number);
        setProductNumber(item.product_number ? String(item.product_number) : '');
        setName(item.name ? String(item.name) : '');
        setPrice(item.price !== undefined && item.price !== null ? String(item.price) : '');
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    };

    // Delete a product
    const handleDelete = async (item) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await executeUpdate('DELETE FROM tblproducts WHERE product_number = ?;', [item.product_number]);
                            await loadProducts();
                        } catch (error) {
                            showAlert('Error', 'Failed to delete product.');
                        }
                    }
                }
            ]
        );
    };

    // Cancel editing or adding
    const handleCancel = () => {
        if (editingId || productNumber || name || price) {
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
                            setProductNumber('');
                            setName('');
                            setPrice('');
                        }
                    }
                ]
            );
        } else {
            setEditingId(null);
            setProductNumber('');
            setName('');
            setPrice('');
        }
    };

    return (
        // Main product management UI
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <FlatList
                ref={flatListRef}
                style={styles.bigList}
                data={products}
                ListHeaderComponent={
                    <View style={styles.main}>
                        <Text style={styles.title}>Manage Products</Text>
                        {/* Product number, name, and price inputs */}
                        <InputWithLeftIcon
                            iconName="numbers"
                            placeholder="Product Number (e.g. 1234)"
                            value={productNumber}
                            onChangeText={text => setProductNumber(text.replace(/[^0-9]/g, '').slice(0, 4))}
                            keyboardType='numeric'
                            editable={!editingId}
                            style={[styles.inputWithLeftIcon, editingId ? { backgroundColor: '#DADADA' } : null]}
                            rightIcon={diceIcon}
                            onRightIconPress={async () => {
                                if (!editingId) {
                                    // Fetch all existing product numbers
                                    const existingProducts = await executeQuery('SELECT product_number FROM tblproducts;');
                                    const existingNumbers = existingProducts.map(p => String(p.product_number));
                                    let randomNum;
                                    let attempts = 0;
                                    do {
                                        randomNum = Math.floor(1000 + Math.random() * 9000).toString();
                                        attempts++;
                                    } while (existingNumbers.includes(randomNum) && attempts < 20);
                                    if (existingNumbers.includes(randomNum)) {
                                        showAlert('Error', 'Could not generate a unique product number.');
                                        return;
                                    }
                                    setProductNumber(randomNum);
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
                        <InputWithLeftIcon
                            iconName="drive-file-rename-outline"
                            placeholder="Product Name (e.g. Apple)"
                            value={name}
                            onChangeText={setName}
                        />
                        <InputWithLeftIcon
                            iconName="attach-money"
                            placeholder="Price (e.g. 9.99)"
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                        />
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.button, { backgroundColor: editingId ? '#FFA500' : '#4CAF50' }]} onPress={handleAddOrUpdate}>
                                <Text style={styles.buttonText}>{editingId ? 'Edit Product' : 'Add Product'}</Text>
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
                        <Text style={{ color: '#888', fontSize: 18 }}>No products found. Add your first product!</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={styles.productCard}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleEdit(item)}>
                                <View style={styles.productRow}>
                                    <Text style={styles.productName}>{item?.name}</Text>
                                    <Text style={styles.productPrice}>${parseFloat(item?.price).toFixed(2)}</Text>
                                </View>
                                <Text style={styles.productNumber}>No: {item?.product_number}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginLeft: 10 }}>
                                <MaterialIcons name="delete" size={28} color="#FE0000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                keyExtractor={(item, index) => (item.product_id ? item.product_id.toString() : index.toString())}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );
}

// Styles for ProductsScreen UI elements
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
