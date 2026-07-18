require('dotenv').config();
const mongoose = require('mongoose');
const { getMatchResult } = require('./src/services/matchingService');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const { getMatchResult } = require('./src/services/matchingService');
    const result = await getMatchResult('CI4PO05788');
    console.log(JSON.stringify(result, null, 2));
    mongoose.connection.close();
}
run();
