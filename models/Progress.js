const db = require('../db');

const Progress = {
    getProgressByUserId: (userId, callback) => {
        const sql = 'SELECT video_id, watched FROM user_progress WHERE user_id = ?';
        db.query(sql, [userId], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    },

    setProgress: (userId, videoId, watched, callback) => {
        const sql = `
            INSERT INTO user_progress (user_id, video_id, watched) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE watched = VALUES(watched)
        `;
        db.query(sql, [userId, videoId, watched], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    }
};

module.exports = Progress;
