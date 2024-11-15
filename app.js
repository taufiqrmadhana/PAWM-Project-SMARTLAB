import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import path from 'path'; 
import bcrypt from 'bcryptjs'; 
import db from './db.js'; 
import authController from './controllers/authController.js'; 
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import RedisStore from 'connect-redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express(); // Initialize `app`

// Set up Redis client
const redisClient = createClient({
    url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

// Event listener for successful Redis connection
redisClient.on('connect', () => {
    console.log('Connected to Redis!');
});

// Event listener for Redis errors
redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
});

// Connect to Redis and handle commands
async function setupRedis() {
    try {
        // Ensure that Redis is connected
        await redisClient.connect();
        console.log("Redis client is connected");

        // Test Redis ping command
        const response = await redisClient.ping();
        console.log("Redis ping response:", response);  // Should print "PONG"

        // Example Redis set/get commands
        await redisClient.set('key', 'value');
        const value = await redisClient.get('key');
        console.log('Value for key:', value);  // Should print 'value'
    } catch (err) {
        console.error('Error with Redis:', err);
    }
}

// Call the setup function to connect Redis and test it
setupRedis();

// Set up session store with Redis
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Hanya di https saat produksi
        httpOnly: true,
        sameSite: 'strict', // Pastikan sama situs
        maxAge: 24 * 60 * 60 * 1000,  // 1 hari
    }
}));

// Middleware to parse body of POST requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware to log the user session for debugging
app.use((req, res, next) => {
    console.log('Session:', req.session);
    next();
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.username) {
        console.log("User is authenticated:", req.session.username);
        return next();
    } else {
        console.log("User not authenticated. Redirecting to /login");
        res.redirect('/login');
    }
}

// Example route to get user's progress
import Progress from './models/Progress.js'; // Add `.js` extension
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

// Example route for updating user's progress
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

// Route to calculate completion percentage based on watched videos
app.get('/api/average-grade', isAuthenticated, (req, res) => {
    const userId = req.session.userId; 

    Progress.getProgressByUserId(userId, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve progress' });
        }
        const watchedVideos = results.filter(row => row.watched).length;
        const totalVideos = 12; 
        const completionPercentage = Math.round((watchedVideos / totalVideos) * 100);

        res.json({ completionPercentage });
    });
});

// Example route for submitting quiz answers
app.post('/submit-quiz', (req, res) => {
    const userId = req.body.userId;
    const answers = req.body.answers;

    const correctAnswers = {
        question1: 'b', 
        question2: 'a', 
        question3: 'b', 
        question4: 'a', 
        question5: 'a', 
        question6: 'a'  
    };    
    let score = 0;
    for (let question in correctAnswers) {
        if (answers[question] === correctAnswers[question]) {
            score += 1;
        }
    }

    const updateQuery = 'UPDATE users SET quizscore = ? WHERE id = ?';
    db.query(updateQuery, [score, userId], (error, results) => {
        if (error) {
            console.error('Error saving quiz score:', error);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true, score });
    });
});

// Serve static files for frontend (CSS, JS, assets)
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));

// Route for the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/login/index.html'));
});

// Route for the signup page
app.get('/sign-up', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/sign-up/index.html'));
});

// Route for login and register using authController
app.post('/auth/login', authController.login);
app.post('/auth/register', authController.register);

// Middleware for ensuring authentication for certain routes
app.use(isAuthenticated);

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Route for the interactive lab page
app.get('/interactive', (req, res) => {
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

// Logout route
app.get('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Start the server
app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});

export default app; 
