import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { initializeTables, executeQuery, executeUpdate } from '../utils/database';

// Show an alert dialog with a title and message
const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }], { cancelable: true });
};

// OrdersSummaryScreen displays a list of orders and allows viewing/deleting details
export default function OrdersSummaryScreen() {
    // State for the list of orders
    const [orders, setOrders] = useState([]);
    // State for the selected order details
    const [selectedOrder, setSelectedOrder] = useState(null);
    // State for the products in the selected order
    const [orderProducts, setOrderProducts] = useState([]);
    // State for showing the detail modal
    const [showDetail, setShowDetail] = useState(false);
    // Ref for scrolling the FlatList
    const flatListRef = useRef(null);

    // Initialize tables and load orders on mount
    useEffect(() => {
        const init = async () => {
            await initializeTables();
            await loadOrders();
        };
        init();
    }, []);

    // Refresh orders when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadOrders();
        }, [])
    );

    // Fetch all orders from the database
    const loadOrders = async () => {
        const allRows = await executeQuery(
            'SELECT o.*, c.name as customer_name FROM tblorders o JOIN tblcustomers c ON o.customer_id = c.customer_id ORDER BY o.order_number DESC;'
        );
        setOrders(allRows);
    };

    // Fetch products for a specific order
    const loadOrderProducts = async (orderNum) => {
        const allRows = await executeQuery(
            'SELECT op.*, p.name, p.price FROM tblorder_products op JOIN tblproducts p ON op.product_number = p.product_number WHERE op.order_number = ?;',
            [orderNum]
        );
        setOrderProducts(allRows);
    };

    // Show order details
    const handleShowDetails = async (order) => {
        setSelectedOrder(order);
        await loadOrderProducts(order.order_number);
        setShowDetail(true);
    };

    // Hide order details
    const handleCloseDetails = () => {
        setShowDetail(false);
        setSelectedOrder(null);
        setOrderProducts([]);
    };

    // Delete an order and its associated products
    const handleDeleteOrder = async (order_number) => {
        Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await executeUpdate('DELETE FROM tblorder_products WHERE order_number = ?;', [order_number]);
                        await executeUpdate('DELETE FROM tblorders WHERE order_number = ?;', [order_number]);
                        await loadOrders();
                    } catch (error) {
                        showAlert('Error', 'Failed to delete order.');
                    }
                }
            }
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <FlatList
                ref={flatListRef}
                style={styles.bigList}
                data={orders}
                ListHeaderComponent={
                    <View style={styles.main}>
                        <Text style={styles.title}>Orders Summary</Text>
                        <View style={styles.horizontalLine} />
                    </View>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: '#888', fontSize: 18 }}>No orders found.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleShowDetails(item)} style={{ paddingHorizontal: 16 }}>
                        <View style={styles.productCard}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.productName}>Order #{item.order_number}</Text>
                                <Text style={styles.productNumber}>{item.customer_name}</Text>
                                <Text style={styles.productNumber}>{item.date}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                <Text style={styles.productPrice}>Total Price</Text>
                                <Text style={[styles.productPrice, { fontSize: 16, color: '#4CAF50' }]}>${parseFloat(item.total_price).toFixed(2)}</Text>
                                <TouchableOpacity onPress={() => handleDeleteOrder(item.order_number)} style={{ marginTop: 10 }}>
                                    <FontAwesome5 name="trash" size={22} color="#FE0000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => (item.order_number ? item.order_number.toString() : index.toString())}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
            {/* Order Details Modal */}
            {showDetail && selectedOrder && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 28, width: '92%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 }}>
                        <TouchableOpacity onPress={handleCloseDetails} style={{ position: 'absolute', top: 10, right: 10, zIndex: 20 }}>
                            <FontAwesome5 name="times" size={24} color="#888" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#FE4684', textAlign: 'center' }}>Order #{selectedOrder.order_number}</Text>
                        <View style={{ marginBottom: 12, alignItems: 'center' }}>
                            <Text style={{ fontSize: 17, color: '#222', fontWeight: '600' }}>{selectedOrder.customer_name}</Text>
                            <Text style={{ fontSize: 15, color: '#888', marginTop: 2 }}>{selectedOrder.date}</Text>
                        </View>
                        <View style={{ borderBottomColor: '#eee', borderBottomWidth: 1, marginBottom: 12 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#222' }}>Products:</Text>
                        {orderProducts.length === 0 ? (
                            <Text style={{ color: '#888', marginBottom: 10 }}>No products in this order.</Text>
                        ) : (
                            orderProducts.map((prod, idx) => (
                                <View key={idx} style={{ marginBottom: 10, backgroundColor: '#F8F8F8', borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{prod.name}</Text>
                                        <Text style={{ color: '#666', fontSize: 14 }}>Qty: {prod.qty}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 15 }}>Subtotal</Text>
                                        <Text style={{ color: '#4CAF50', fontSize: 15 }}>${parseFloat(prod.subtotal).toFixed(2)}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                        <View style={{ borderBottomColor: '#eee', borderBottomWidth: 1, marginVertical: 12 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }}>Total Price</Text>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FE4684' }}>${parseFloat(selectedOrder.total_price).toFixed(2)}</Text>
                        </View>

                    </View>
                </View>
            )}
        </View>
    );
}

// Styles for the summary screen UI elements
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
});
