require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Document = require('./src/models/Document');

async function dump() {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await Document.find({});
    
    let md = "# Extracted Gemini Data\n\nThis artifact shows exactly what Gemini extracted from your PDFs.\n\n";
    
    docs.forEach(doc => {
        md += `## Document: ${doc.documentType.toUpperCase()} | PO: ${doc.poNumber}\n`;
        md += "```json\n";
        md += JSON.stringify(doc.parsedData.items, null, 2);
        md += "\n```\n\n";
    });
    
    fs.writeFileSync('C:\\Users\\yraje\\.gemini\\antigravity\\brain\\88286c81-7a2d-43e4-9a5f-a7498c37498c\\sample_parsed_json.md', md);
    console.log("Artifact created!");
    mongoose.connection.close();
}
dump();
