// server/controllers/shelterController.js

const Pet = require('../Model/petmodel');  // Import Pet model
const Adoption = require('../Model/adoption');  // Import Adoption model

exports.getShelterStats = async (req, res) => {
    try {
        // Assuming `req.user` contains the authenticated shelter owner's info
        const shelterOwnerId = req.user._id;

        // Fetch the number of pets owned by the shelter owner
        const petsAvailable = await Pet.countDocuments({ owner: shelterOwnerId });

        // Set the total shelter capacity to 100 for all shelters
        const totalCapacity = 100;

        // Fetch the number of adoption requests pending (Adoptions with 'Pending' paymentStatus)
        const requestsPending = await Adoption.countDocuments({
            petOwnerId: shelterOwnerId,
            paymentStatus: 'Pending',
        });

        // Send the data as a JSON response
        res.json({
            petsAvailable,
            totalCapacity,
            requestsPending
        });
    } catch (error) {
        console.error('Error fetching shelter stats:', error);
        res.status(500).json({ error: 'Error fetching shelter stats' });
    }
};
