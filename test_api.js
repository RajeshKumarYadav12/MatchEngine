require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModel(modelName) {
    try {
        console.log(`Testing model: ${modelName}`);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        console.log(`Success with ${modelName}:`, result.response.text());
        return true;
    } catch (e) {
        console.error(`Failed with ${modelName}:`, e.message);
        return false;
    }
}

async function run() {
    const models = [
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-3.5-flash",
        "gemini-2.0-flash-lite-001"
    ];
    for (const m of models) {
        await testModel(m);
    }
}
run();
