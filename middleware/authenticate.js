const jwt = require('jsonwebtoken');
const User = require('../Model/model'); // User model

const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error('User not found.');
        }

        req.user = user;  // Attach the user to the request
        next();  // Proceed to the next step (the dashboard)
    } catch (error) {
        res.status(401).json({ error: 'Invalid token or authentication failed.' });
    }
};

module.exports = { authenticate };
