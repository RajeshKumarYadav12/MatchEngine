const Document = require('../models/Document');
const { parseDocument } = require('../services/geminiService');
const { getMatchResult } = require('../services/matchingService');

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { documentType } = req.body;
        if (!['po', 'grn', 'invoice'].includes(documentType)) {
            return res.status(400).json({ error: 'Invalid documentType. Must be po, grn, or invoice' });
        }

        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // Parse with Gemini
        const parsedData = await parseDocument(fileBuffer, mimeType, documentType);

        if (!parsedData.poNumber) {
            return res.status(400).json({ error: 'Failed to extract poNumber from document' });
        }

        if (documentType === 'po') {
            await Document.deleteMany({ poNumber: parsedData.poNumber, documentType: 'po' });
        } else {
            // Prevent duplicate uploads of the exact same GRN/Invoice file for testing purposes
            await Document.deleteMany({ poNumber: parsedData.poNumber, documentType, originalFileName: req.file.originalname });
        }

        const document = new Document({
            documentType,
            poNumber: parsedData.poNumber,
            parsedData,
            originalFileName: req.file.originalname
        });

        await document.save();

        // Optionally get latest match state to return
        const matchState = await getMatchResult(document.poNumber);

        res.status(201).json({
            message: 'Document uploaded and parsed successfully',
            documentId: document._id,
            poNumber: document.poNumber,
            matchState
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
