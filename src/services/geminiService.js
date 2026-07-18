const { GoogleGenAI } = require('@google/genai');

const getGenerativeModel = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const parseDocument = async (fileBuffer, mimeType, documentType) => {
    const ai = getGenerativeModel();

    let expectedSchema = "";
    if (documentType === 'po') {
        expectedSchema = `
        {
            "poNumber": "string",
            "poDate": "string",
            "vendorName": "string",
            "items": [
                {
                    "itemCode": "string",
                    "description": "string",
                    "quantity": number
                }
            ]
        }
        `;
    } else if (documentType === 'grn') {
        expectedSchema = `
        {
            "grnNumber": "string",
            "poNumber": "string",
            "grnDate": "string",
            "items": [
                {
                    "itemCode": "string",
                    "description": "string",
                    "receivedQuantity": number
                }
            ]
        }
        `;
    } else if (documentType === 'invoice') {
        expectedSchema = `
        {
            "invoiceNumber": "string",
            "poNumber": "string",
            "invoiceDate": "string",
            "items": [
                {
                    "itemCode": "string",
                    "description": "string",
                    "quantity": number
                }
            ]
        }
        `;
    }

    const prompt = `
    You are an expert at extracting structured data from documents.
    Extract the information from this ${documentType.toUpperCase()} document and return it STRICTLY as a valid JSON object matching the following structure:
    ${expectedSchema}
    
    CRITICAL RULE FOR itemCode: The documents use different physical item codes for the same products. 
    You MUST generate a canonical 'itemCode' based on the core product description and weight/pieces to perfectly link them.
    - Convert to lowercase, remove all spaces and special characters.
    - Remove brand names (psm, meatigo) and noise words (frozen, rtc, %, skinless, plain).
    - Standardize units (e.g. 24.0 Pieces -> 24pc, 450.0 g -> 450g).
    Example: "Cheesy Spicy Veg Momos 24.0 Pieces" -> "cheesyspicyvegmomos24pc".
    Use this generated string as the 'itemCode' for every item. DO NOT use the original item code from the PDF.
    
    Do not wrap the JSON in Markdown formatting like \`\`\`json, just return the raw JSON string.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
                prompt,
                { inlineData: { data: fileBuffer.toString("base64"), mimeType: mimeType } }
            ]
        });
        const responseText = response.text;
        
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.substring(7);
        } else if (jsonStr.startsWith('\`\`\`')) {
            jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith('\`\`\`')) {
            jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        
        return JSON.parse(jsonStr.trim());
    } catch (error) {
        console.error("Error parsing document with Gemini:", error);
        throw new Error("Failed to parse document with Gemini API: " + error.message);
    }
};

module.exports = {
    parseDocument
};
