const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adoptionSchema = new Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    petOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the pet owner
    paymentStatus: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Adoption = mongoose.model('Adoption', adoptionSchema);
module.exports = Adoption;
