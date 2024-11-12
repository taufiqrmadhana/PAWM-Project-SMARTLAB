const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: '../.env' }); // Sesuaikan jika .env berada di root

// Initialize Express app
const app = express();

app.use(session({
    secret: 'Mantap123@',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }  // Set true jika menggunakan HTTPS
}));

function isAuthenticated(req, res, next) {
    if (req.session.username) {  // Atau sesuaikan dengan nama properti sesi yang Anda gunakan
        return next();  // Lanjutkan ke route berikutnya jika pengguna sudah login
    } else {
        res.redirect('/login');  // Redirect ke halaman login jika belum login
    }
}

// Middleware to parse URL-encoded bodies (form data) and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend'))); // Tambahkan ../ untuk akses ke root frontend

// Database connection
const db = require('./db');

// Define routes for pages
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html')); // Gunakan ../ untuk akses ke frontend
});

app.get('/login', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login/index.html'));
});

app.get('/sign-up', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/sign-up/index.html'));
});

// Import auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes); // Routes for authentication (register and login)

// Start server on Port 3000
app.listen(3000, () => {
    console.log("Server started on Port 3000");
});
