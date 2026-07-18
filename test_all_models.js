require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = [
        'gemini-1.5-flash', 'gemini-1.5-pro',
        'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-pro-exp',
        'gemini-2.5-flash', 'gemini-2.5-pro',
        'gemini-3.0-flash', 'gemini-3.5-flash',
        'gemini-flash-latest', 'gemini-pro-latest'
    ];
    
    console.log("Testing all models with current API Key...");
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`[SUCCESS] ${modelName}: Works!`);
        } catch (e) {
            let reason = "Unknown Error";
            if (e.message.includes('404')) reason = '404 Not Found';
            else if (e.message.includes('403')) reason = '403 Forbidden';
            else if (e.message.includes('429')) reason = '429 Rate Limit (Quota 0)';
            else reason = e.message.substring(0, 50);
            console.log(`[FAILED]  ${modelName}: ${reason}`);
        }
    }
}
run();
