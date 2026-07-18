const Document = require('../models/Document');

const getMatchResult = async (poNumber) => {
    const documents = await Document.find({ poNumber });

    const pos = documents.filter(doc => doc.documentType === 'po');
    const grns = documents.filter(doc => doc.documentType === 'grn');
    const invoices = documents.filter(doc => doc.documentType === 'invoice');

    const result = {
        poNumber,
        currentDocuments: {
            po: pos.length,
            grn: grns.length,
            invoice: invoices.length
        },
        status: 'insufficient_documents',
        reasons: []
    };

    if (pos.length === 0) {
        result.reasons.push('item_missing_in_po'); // Actually, PO itself is missing
        return result;
    }

    if (pos.length > 1) {
        result.reasons.push('duplicate_po');
        result.status = 'mismatch';
        return result;
    }

    const po = pos[0].parsedData;

    if (grns.length === 0 || invoices.length === 0) {
        result.status = 'insufficient_documents';
        return result;
    }

    // Smart normalization function to handle edge cases where Gemini outputs slightly different canonical codes
    const normalizeDesc = (desc) => {
        if (!desc) return "";
        let s = desc.toLowerCase();
        s = s.replace(/\bpsm\b/g, '')
             .replace(/\bmeatigo\b/g, '')
             .replace(/\brtc\b/g, '')
             .replace(/\bfrozen\b/g, '')
             .replace(/vegetable/g, 'veg')
             .replace(/kheema/g, 'keema')
             .replace(/sausages/g, 'sausage')
             .replace(/cuts/g, 'cut')
             .replace(/original/g, '')
             .replace(/mince/g, '')
             .replace(/pieces|pcs/g, 'pc')
             .replace(/\([0-9]+%\)/g, '') 
             .replace(/\.0\b/g, ''); 
        return s.replace(/[^a-z0-9]/g, '');
    };

    const poItemsMap = new Map();
    (po.items || []).forEach(item => {
        const normKey = normalizeDesc(item.itemCode) || item.itemCode;
        poItemsMap.set(normKey, {
            poQty: item.quantity,
            poDate: po.poDate,
            totalGrnQty: 0,
            totalInvoiceQty: 0,
            originalItemCode: item.itemCode,
            description: item.description
        });
    });

    const getTokens = (desc) => {
        if (!desc) return new Set();
        const s = desc.toLowerCase()
            .replace(/\.0\b/g, '') // convert 1.0 to 1
            .replace(/psm|meatigo|rtc|frozen|pcs|pieces/g, '')
            .replace(/[^a-z0-9]/g, ' ');
        return new Set(s.split(/\s+/).filter(w => w.length > 1));
    };

    const getSimilarity = (desc1, desc2) => {
        const set1 = getTokens(desc1);
        const set2 = getTokens(desc2);
        if (set1.size === 0 || set2.size === 0) return 0;
        
        let intersection = 0;
        for (let w of set1) {
            if (set2.has(w)) {
                intersection++;
            } else {
                // Check for partial substring matches (e.g. kabab vs kebab, veg vs vegetable)
                for (let w2 of set2) {
                    if (w.includes(w2) || w2.includes(w)) {
                        intersection++;
                        break;
                    }
                }
            }
        }
        return intersection / Math.max(set1.size, set2.size);
    };

    const findMatchKey = (itemCode, desc) => {
        const norm = normalizeDesc(itemCode);
        if (poItemsMap.has(norm)) return norm;
        if (poItemsMap.has(itemCode)) return itemCode;
        
        for (let key of poItemsMap.keys()) {
            if (norm.length > 5 && (key.includes(norm) || norm.includes(key))) {
                return key;
            }
        }
        
        // Advanced Fallback: Description token overlap similarity
        let bestKey = null;
        let maxSim = 0;
        for (let [key, data] of poItemsMap.entries()) {
            const sim = getSimilarity(desc, data.description);
            if (sim > maxSim) {
                maxSim = sim;
                bestKey = key;
            }
        }
        
        if (maxSim >= 0.4) { // At least 40% of the significant words must overlap
            return bestKey;
        }
        
        return null;
    };

    // Aggregate GRN quantities
    grns.forEach(grnDoc => {
        const grn = grnDoc.parsedData;
        (grn.items || []).forEach(item => {
            const key = findMatchKey(item.itemCode, item.description);
            if (key) {
                poItemsMap.get(key).totalGrnQty += item.receivedQuantity || 0;
            } else {
                result.reasons.push(`item_missing_in_po: ${item.itemCode} found in GRN`);
            }
        });
    });

    // Aggregate Invoice quantities and check dates
    invoices.forEach(invDoc => {
        const inv = invDoc.parsedData;
        
        // Date check
        const invDate = new Date(inv.invoiceDate);
        const pDate = new Date(po.poDate);
        
        if (invDate > pDate) {
            if (!result.reasons.includes('invoice_date_after_po_date')) {
                result.reasons.push('invoice_date_after_po_date');
            }
        }

        (inv.items || []).forEach(item => {
            const key = findMatchKey(item.itemCode, item.description);
            if (key) {
                poItemsMap.get(key).totalInvoiceQty += item.quantity || 0;
            } else {
                result.reasons.push(`item_missing_in_po: ${item.itemCode} found in Invoice`);
            }
        });
    });

    let hasMismatch = false;
    let hasPartial = false;
    let allMatched = true;

    // Validate rules per item
    poItemsMap.forEach((data, key) => {
        // GRN quantity must not be greater than PO quantity
        if (data.totalGrnQty > data.poQty) {
            result.reasons.push(`grn_qty_exceeds_po_qty for item ${data.originalItemCode || key}`);
            hasMismatch = true;
            allMatched = false;
        }

        // Invoice quantity must not be greater than PO quantity
        if (data.totalInvoiceQty > data.poQty) {
            result.reasons.push(`invoice_qty_exceeds_po_qty for item ${data.originalItemCode || key}`);
            hasMismatch = true;
            allMatched = false;
        }

        // Invoice quantity must not be greater than total GRN quantity
        if (data.totalInvoiceQty > data.totalGrnQty) {
            result.reasons.push(`invoice_qty_exceeds_grn_qty for item ${data.originalItemCode || key}`);
            hasMismatch = true;
            allMatched = false;
        }
        
        if (data.totalInvoiceQty < data.totalGrnQty || data.totalGrnQty < data.poQty) {
            if (data.totalInvoiceQty > 0 || data.totalGrnQty > 0) {
                 hasPartial = true;
            }
            allMatched = false;
        }
    });

    if (result.reasons.length > 0) {
        // Ensure unique reasons
        result.reasons = [...new Set(result.reasons)];
    }

    if (hasMismatch || result.reasons.length > 0) {
        result.status = 'mismatch';
    } else if (allMatched) {
        result.status = 'matched';
    } else {
        result.status = 'partially_matched';
    }

    return result;
};

module.exports = {
    getMatchResult
};
