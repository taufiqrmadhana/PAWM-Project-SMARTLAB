
const jwt = require('jsonwebtoken');

function login(req, res) {
    const { username, password } = req.body;
    // Replace with actual authentication logic
    if (username === 'test' && password === 'test') {
        const user = { name: username };
        const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    } else {
        res.sendStatus(403);
    }
}

module.exports = login;
