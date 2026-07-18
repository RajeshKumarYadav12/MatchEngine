require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    await Document.deleteMany({});
    console.log("Database cleared!");
    mongoose.connection.close();
}
run();
