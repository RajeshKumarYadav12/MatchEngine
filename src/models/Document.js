const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    documentType: {
        type: String,
        enum: ['po', 'grn', 'invoice'],
        required: true
    },
    poNumber: {
        type: String,
        required: true,
        index: true // Indexed for faster lookups when matching
    },
    parsedData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    originalFileName: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
