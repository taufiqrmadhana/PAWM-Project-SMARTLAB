const express = require("express");
const Quiz = require("../models/Quiz");
const History = require("../models/History");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Middleware untuk verifikasi token
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Submit quiz score
router.post("/submit", authenticateToken, async (req, res) => {
    const { score } = req.body;
    const quiz = new Quiz({ userId: req.user.userId, score });
    await quiz.save();

    const history = new History({ userId: req.user.userId, quizId: quiz._id, score });
    await history.save();

    res.status(201).json({ message: "Quiz score saved" });
});

// Get quiz history
router.get("/history", authenticateToken, async (req, res) => {
    const history = await History.find({ userId: req.user.userId }).populate("quizId");
    res.json(history);
});

module.exports = router;
