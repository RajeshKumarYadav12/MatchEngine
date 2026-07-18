require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');

async function dump() {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await Document.find({});
    
    docs.forEach(doc => {
        console.log(`\n=== Document: ${doc.documentType} | PO: ${doc.poNumber} ===`);
        console.log(JSON.stringify(doc.parsedData.items, null, 2));
    });
    
    mongoose.connection.close();
}
dump();
