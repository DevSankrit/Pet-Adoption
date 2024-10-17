const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
    petsAvailable: { type: Number, required: true },
    totalCapacity: { type: Number, required: true },
    requestsPending: { type: Number, required: true }
});

const Shelter = mongoose.model('Shelter', shelterSchema);

module.exports = Shelter;
