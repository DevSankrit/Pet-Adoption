const Pet = require('../Model/petmodel');

const addPet = async (req, res) => {
    try {
        // Ensure the user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in to add a pet.' });
        }

        // Destructuring the fields from the request body
        const { name, type, breed, age, gender, vaccination, neutered, medical_conditions } = req.body;
        const owner = req.user._id; // The logged-in user's ID should be assigned to the owner field
        
        // Handle file upload for the pet's photo
        let photoUrl = '';
        if (req.file) {
            // Store the file path of the uploaded photo (Multers saves it in req.file)
            photoUrl = req.file.path;
        }

        // Create a new pet instance
        const newPet = new Pet({
            name,
            type,
            breed,
            age,
            gender,
            vaccination,
            neutered,
            medical_conditions,
            photo: photoUrl, // Save the uploaded photo path
            owner // Link the pet to the logged-in user's ID
        });

        // Save the pet to the database
        await newPet.save();

        // Respond with a success message and redirect to the manage pets page
        res.redirect('/managepets'); // Redirect to the page where the user can see their pets
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPets = async (req, res) => {
    try {
        // Fetch the pets for the logged-in user
        const pets = await Pet.find({ owner: req.user._id });

        // Render the Manage Pets page with the user's pets
        res.render('managePets', { pets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

//delete pet

const deletePet = async (req, res) => {
    try {
        const petId = req.params.petId;

        // Find the pet by ID and ensure it belongs to the logged-in user
        const pet = await Pet.findOneAndDelete({ _id: petId, owner: req.user._id });

        if (!pet) {
            return res.status(404).json({ message: 'Pet not found or you are not authorized to delete this pet' });
        }

        // Redirect back to the manage pets page after deletion
        res.redirect('/managepets');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Export both addPet and getPets together
module.exports = { addPet, getPets, deletePet };
