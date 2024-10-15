const express = require('express');
const router = express.Router();
const Pet = require('../Model/petmodel'); // Import Pet model

// Get all pets
router.get('/api/pets', async (req, res) => {
    try {
        const pets = await Pet.find(); // Fetch all pets from the database
        res.status(200).json(pets);
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
