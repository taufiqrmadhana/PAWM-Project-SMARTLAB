const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const authController = require('./controllers/authController');

const app = express(); // Inisialisasi `app`

// Middleware untuk parsing body dari POST request
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

console.log("Middleware setup complete");

// Middleware untuk memeriksa apakah user sudah login
function isAuthenticated(req, res, next) {
    if (req.session.username) {
        console.log("User is authenticated:", req.session.username);
        return next();
    } else {
        console.log("User not authenticated. Redirecting to /login");
        res.redirect('/login');
    }
}

// Serve static files untuk frontend (CSS, JS, assets)
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));

// Route untuk halaman login
app.get('/login', (req, res) => {
    console.log("Serving login page");
    res.sendFile(path.join(__dirname, 'frontend/login/index.html'));
});

// Route untuk halaman signup
app.get('/sign-up', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/sign-up/index.html'));
});

// Route untuk proses login dan registrasi menggunakan authController
app.post('/auth/login', authController.login);
app.post('/auth/register', authController.register);

// Middleware global untuk memastikan autentikasi pada semua halaman di bawahnya
app.use(isAuthenticated);

// Route untuk halaman utama
app.get('/', (req, res) => {
    console.log("Serving home page");
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Route untuk halaman Interactive Lab
app.get('/interactive', (req, res) => {
    console.log("Serving interactive lab page");
    res.sendFile(path.join(__dirname, 'frontend/interactive/index.html'));
});

app.get('/interactive/math', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/interactive/mathvisualization.html'));
});

app.get('/interactive/programming', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/interactive/programming-lab.html'));
});

// Route untuk halaman Materials
app.get('/materials', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/materials/index.html'));
});

// Route untuk halaman Quiz
app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/quiz/index.html'));
});

app.get('/quiz/math', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/quiz/math-quiz.html'));
});

app.get('/quiz/programming', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/quiz/programming-quiz.html'));
});

// Endpoint untuk mendapatkan data user yang sedang login
app.get('/auth/user', (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Route untuk logout
app.get('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        console.log("Session destroyed. Redirecting to /login");
        res.redirect('/login');
    });
});

// Jalankan server
app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
