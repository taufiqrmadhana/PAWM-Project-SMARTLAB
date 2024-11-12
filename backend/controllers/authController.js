// backend/controllers/authController.js
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const db = require('../db'); // Pastikan db.js sudah disiapkan untuk koneksi yang dapat digunakan kembali

// Register new user
exports.register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    // Check if passwords match
    if (password !== passwordConfirm) {
        return res.status(400).send("Passwords do not match!");
    }

    // Check if the email is already in use
    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send("An error occurred. Please try again later.");
        }

        if (results.length > 0) {
            return res.status(400).send("That email is already in use.");
        }

        // Hash the password
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 8);
        } catch (hashError) {
            console.error(hashError);
            return res.status(500).send("Error encrypting the password.");
        }

        // Insert new user into the database
        db.query(
            'INSERT INTO users SET ?',
            { name: name, email: email, password: hashedPassword },
            (insertError, insertResults) => {
                if (insertError) {
                    console.error(insertError);
                    return res.status(500).send("Error saving user. Please try again later.");
                }
                res.redirect('/login'); // Redirect to login page after successful registration
            }
        );
    });
};

// Login user
exports.login = (req, res) => {
    const { email, password } = req.body;

    // Check if the user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send("An error occurred. Please try again later.");
        }

        if (results.length === 0) {
            return res.status(400).send("Email or Password is incorrect");
        }

        // Check if password matches
        try {
            const isMatch = await bcrypt.compare(password, results[0].password);
            if (!isMatch) {
                return res.status(400).send("Email or Password is incorrect");
            }
            res.redirect('/'); // Redirect to the main page upon successful login
        } catch (compareError) {
            console.error(compareError);
            return res.status(500).send("Error validating password. Please try again later.");
        }
    });
};
