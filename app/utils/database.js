import * as SQLite from 'expo-sqlite';

let db = null;
let isInitialized = false;

// Get database instance with proper initialization
export async function getDatabase() {
    if (!db) {
        try {
            db = await SQLite.openDatabaseAsync('myDatabase.db');
            // Enable foreign keys and set journal mode
            await db.execAsync(`
                PRAGMA foreign_keys = ON;
                PRAGMA journal_mode = WAL;
            `);
            isInitialized = true;
        } catch (error) {
            console.error('Error opening database:', error);
            db = null;
            isInitialized = false;
            throw error;
        }
    }
    return db;
}

// Initialize all tables
export async function initializeTables() {
    try {
        if (!isInitialized) {
            const db = await getDatabase();
            if (!db) throw new Error('Failed to initialize database');
            
            // Users table
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS tblusers (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT,
                    email TEXT,
                    username TEXT UNIQUE,
                    password TEXT,
                    is_logged_in INTEGER DEFAULT 0
                );
            `);

            // Products table
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS tblproducts (
                    product_number TEXT PRIMARY KEY,
                    name TEXT,
                    price REAL
                );
            `);

            // Customers table
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS tblcustomers (
                    customer_id TEXT PRIMARY KEY,
                    name TEXT,
                    phone TEXT
                );
            `);

            // Orders table
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS tblorders (
                    order_number INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    customer_id TEXT NOT NULL,
                    total_price REAL NOT NULL,
                    FOREIGN KEY (customer_id) REFERENCES tblcustomers(customer_id)
                );
            `);

            // Order Products table
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS tblorder_products (
                    order_number INTEGER NOT NULL,
                    product_number TEXT NOT NULL,
                    qty INTEGER NOT NULL,
                    subtotal REAL NOT NULL,
                    FOREIGN KEY (order_number) REFERENCES tblorders(order_number),
                    FOREIGN KEY (product_number) REFERENCES tblproducts(product_number)
                );
            `);
        }
    } catch (error) {
        console.error('Error initializing tables:', error);
        isInitialized = false;
        throw error;
    }
}

// Helper functions for common operations
export async function executeQuery(query, params = []) {
    try {
        if (!isInitialized) {
            await initializeTables();
        }
        const db = await getDatabase();
        if (!db) throw new Error('Database not initialized');
        return await db.getAllAsync(query, params);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

export async function executeUpdate(query, params = []) {
    try {
        if (!isInitialized) {
            await initializeTables();
        }
        const db = await getDatabase();
        if (!db) throw new Error('Database not initialized');
        return await db.runAsync(query, params);
    } catch (error) {
        console.error('Error executing update:', error);
        throw error;
    }
}

export async function executeTransaction(queries) {
    let db;
    try {
        if (!isInitialized) {
            await initializeTables();
        }
        db = await getDatabase();
        if (!db) throw new Error('Database not initialized');

        // Start transaction
        await db.execAsync('BEGIN TRANSACTION;');
        
        try {
            // Execute all queries
            for (const { query, params = [] } of queries) {
                await db.runAsync(query, params);
            }
            // Commit transaction
            await db.execAsync('COMMIT;');
        } catch (error) {
            // Rollback on error
            if (db) {
                await db.execAsync('ROLLBACK;');
            }
            throw error;
        }
    } catch (error) {
        console.error('Error executing transaction:', error);
        throw error;
    }
}

// Helper function to check if database is ready
export async function isDatabaseReady() {
    try {
        if (!isInitialized) {
            await initializeTables();
        }
        const db = await getDatabase();
        return db !== null;
    } catch (error) {
        console.error('Error checking database readiness:', error);
        return false;
    }
}

// Close database connection and reset state
export async function closeDatabase() {
    if (db) {
        try {
            await db.closeAsync();
        } catch (error) {
            console.error('Error closing database:', error);
        }
    }
    db = null;
    isInitialized = false;
}

// Logout function that cleans up database and resets login state
export async function logout() {
    try {
        // Reset all users' login status
        if (db) {
            await executeUpdate('UPDATE tblusers SET is_logged_in = 0;');
        }
        // Close database connection
        await closeDatabase();
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
} 