const mongoose = require('mongoose'); // importing mongoose
const bcrypt = require('bcryptjs'); // For password hashing

// Creating the model to save the data in the MongoDB database
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true, // Trims whitespace from name
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Converts email to lowercase
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Minimum password length
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10); // Hash the password with a salt rounds of 10
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
