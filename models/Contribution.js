const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is Required']
    },

    contributedTo: {
        type: String,
        required: [true, 'Contribution Purpose is Required']
    },

    description: {
        type: String,
        required: [true, 'Description is Required']
    },

    amount: {
        type: Number,
        required: [true, 'Amount is Required'],
        min: [0, 'Amount cannot be negative']
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Contribution', contributionSchema);