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

const Progress = require('./models/Progress');

// Get user's progress
app.get('/materials/progress', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    Progress.getProgressByUserId(userId, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve progress' });
        }
        const watchedVideoIds = results.filter(row => row.watched).map(row => row.video_id);
        res.json({ watchedVideos: watchedVideoIds });
    });
});


// Update user's progress for a specific video
app.post('/materials/progress/:videoId', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const videoId = req.params.videoId;
    const watched = req.body.watched;

    Progress.setProgress(userId, videoId, watched, (err, result) => {
        if (err) {
            console.error('Failed to update progress:', err);
            return res.status(500).json({ error: 'Failed to update progress' });
        }
        res.json({ success: true });
    });
});


// In your server.js or a relevant route file
// Calculate completion percentage based on watched videos
app.get('/api/average-grade', isAuthenticated, (req, res) => {
    const userId = req.session.userId; 

    // Use the same progress fetching logic from /materials/progress
    Progress.getProgressByUserId(userId, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve progress' });
        }
        // Calculate completion based on watched videos count
        const watchedVideos = results.filter(row => row.watched).length;
        const totalVideos = 12; // Avoid division by zero
        const completionPercentage = Math.round((watchedVideos / totalVideos) * 100);

        res.json({ completionPercentage });
    });
});

app.get('/api/quiz-scores', (req, res) => {
    const userId = req.session.userId;

    const query = 'SELECT quizscore FROM users WHERE id = ?';
    db.query(query, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        // Check if the query returned any results
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if quizscore is null and replace it with 0
        const quizscore = results[0].quizscore !== null ? results[0].quizscore : 0;

        // Send the quiz score back
        res.json({ success: true, quizscore: quizscore });
    });
});


app.post('/submit-quiz', (req, res) => {
    const userId = req.body.userId;
    const answers = req.body.answers;

    // Logika untuk menghitung skor (contoh sederhana, tergantung pada logika penilaian kuis Anda)
    const correctAnswers = {
        question1: 'b', // All distinct elements from both sets
        question2: 'a', // Increases or decreases at a constant rate
        question3: 'b', // 0.5
        question4: 'a', // x = 5
        question5: 'a', // f'(x) = 2x
        question6: 'a'  // 180 degrees
    };    
    let score = 0;
    for (let question in correctAnswers) {
        if (answers[question] === correctAnswers[question]) {
            score += 1; // Penilaian sederhana; satu poin per jawaban benar
        }
    }

    // Simpan skor ke database pada kolom `quizscore`
    const updateQuery = 'UPDATE users SET quizscore = ? WHERE id = ?';
    db.query(updateQuery, [score, userId], (error, results) => {
        if (error) {
            console.error('Error saving quiz score:', error);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true, score });
    });
});

// Tambahkan endpoint untuk menyimpan skor kuis
app.post('/api/save-quiz-score', isAuthenticated, (req, res) => {
    const userId = req.session.userId; // Asumsi userId ada dalam session
    const { score } = req.body;

    const query = 'UPDATE users SET quizscore = ? WHERE id = ?';
    db.query(query, [score, userId], (error, results) => {
        if (error) {
            console.error('Error saving score:', error);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true });
    });
});

app.get('/api/get-previous-score', (req, res) => {
    const userId = req.session.userId; // Pastikan userId disimpan di session

    const query = 'SELECT quizscore FROM users WHERE id = ?'; // Ganti 'users' sesuai dengan nama tabel Anda
    db.query(query, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        // Pastikan ada hasil
        const previousScore = results[0] ? results[0].quizscore : null;
        res.json({ success: true, previousScore });
    });
});


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
    res.sendFile(path.join(__dirname, 'frontend/interactive/math-visualization.html'));
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
    res.sendFile(path.join(__dirname, 'frontend/comingsoon/index.html'));
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

module.exports = app; 