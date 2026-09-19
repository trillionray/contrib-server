const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true,
        sparse: true
    },
    fullName: {
        type: String,
        required: [true, 'Full Name is Required']
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    designation: {
        type: String,
        required: [true, 'Designation is Required']
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);