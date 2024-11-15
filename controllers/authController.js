import bcrypt from 'bcryptjs';
import db from '../db.js'; // Import db using ES module syntax

// Register user
const register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
        return res.status(400).json({ error: "Passwords do not match!" });
    }

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occurred. Please try again later." });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: "That email is already in use." });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 8);
            db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Error saving user. Please try again later." });
                }
                res.status(200).json({ success: true });
            });
        } catch (hashError) {
            console.error(hashError);
            return res.status(500).json({ error: "Error encrypting the password." });
        }
    });
};

// Login user
const login = async (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occurred. Please try again later." });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const user = results[0];

        // Verify password
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
