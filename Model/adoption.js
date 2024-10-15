const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true }, // Assuming Pet is another model
    paymentStatus: { type: String, default: 'Pending' },  // Payment status: Pending, Completed, etc.
}, { timestamps: true });

const Adoption = mongoose.model('Adoption', adoptionSchema);

module.exports = Adoption;
