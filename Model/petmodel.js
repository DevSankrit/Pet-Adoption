// server/Model/petModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Pet Schema
const PetSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    vaccination: { type: Boolean, required: true },
    neutered: { type: Boolean, required: true },
    medical_conditions: { type: String, required: false },
    photo: { type: String, required: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User
});

module.exports = mongoose.model('Pet', PetSchema);
