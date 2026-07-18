require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testNewSdk() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: 'Hello, world!'
        });
        console.log("Success with @google/genai and gemini-2.5-flash:");
        console.log(response.text);
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
testNewSdk();
