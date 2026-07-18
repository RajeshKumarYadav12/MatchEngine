const { getMatchResult } = require('../services/matchingService');

exports.getMatch = async (req, res) => {
    try {
        const { poNumber } = req.params;
        if (!poNumber) {
            return res.status(400).json({ error: 'poNumber is required' });
        }

        const matchResult = await getMatchResult(poNumber);
        res.json(matchResult);
    } catch (error) {
        console.error('Error getting match result:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
