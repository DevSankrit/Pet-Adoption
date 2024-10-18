const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adoptionSchema = new Schema({
    customerName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']  // Email validation
    },
    phone: { 
        type: String, 
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid phone number']  // Phone validation (exactly 10 digits)
    },
    petId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Pet', 
        required: true 
    },
    petOwnerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },  // Reference to the pet owner
    paymentStatus: { 
        type: String, 
        default: 'Pending' 
    },
    paymentDetails: { 
        type: Object, 
        default: {}  // Store payment details (e.g., transactionId, payer info) 
    }
}, { timestamps: true });  // Adding timestamps for createdAt and updatedAt

const Adoption = mongoose.model('Adoption', adoptionSchema);
module.exports = Adoption;
