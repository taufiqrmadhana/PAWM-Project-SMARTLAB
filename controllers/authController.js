import bcrypt from 'bcryptjs';
import db from '../db.js'; // Import db using ES module syntax

// Register user
const register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    // Ensure passwords match
    if (password !== passwordConfirm) {
        return res.status(400).json({ error: "Passwords do not match!" });
    }

    // Check if the email already exists in the database
    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error('Database error during email check:', error);
            return res.status(500).json({ error: "An error occurred. Please try again later." });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: "That email is already in use." });
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 8);
            
            // Insert the new user into the database
            db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (err) => {
                if (err) {
                    console.error('Database error during user insert:', err);
                    return res.status(500).json({ error: "Error saving user. Please try again later." });
                }
                res.status(200).json({ success: true });
            });
        } catch (hashError) {
            console.error('Error encrypting the password:', hashError);
            return res.status(500).json({ error: "Error encrypting the password." });
        }
    });
};

// Login user
const login = async (req, res) => {
    const { email, password } = req.body;

    // Query to check if the user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error('Database error during login:', error);
            return res.status(500).json({ error: "An error occurred. Please try again later." });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const user = results[0];

        // Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        // Set session if login is successful
        req.session.username = user.name;
        req.session.userId = user.id;

        res.status(200).json({ message: "Login successful" });
    });
};

// Exporting the functions as named exports
export default { register, login };
