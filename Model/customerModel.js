const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    paymentStatus: { type: String, required: true, default: 'Pending' },
    paymentId: { type: String },  // Razorpay payment ID
    paymentTimestamp: { type: Date },  // Date when payment was processed
});


const Adoption = mongoose.model('Adoption', adoptionSchema);
module.exports = Adoption;