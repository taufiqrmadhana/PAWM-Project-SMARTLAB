const mysql = require('mysql');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a MySQL connection pool (instead of a single connection)
const pool = mysql.createPool({
    connectionLimit: 10, // You can adjust the connection limit based on your needs
    host: process.env.DATABASE_HOST,   // Use your cloud database host
    user: process.env.DATABASE_USER,   // Your database username
    password: process.env.DATABASE_PASSWORD,   // Your database password
    database: process.env.DATABASE,   // Your database name
});

// Test the connection when the pool is created
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('MySQL connected using pool!');
    connection.release();  // Always release the connection back to the pool
});

module.exports = pool; // Export the pool for reuse in other parts of your app
