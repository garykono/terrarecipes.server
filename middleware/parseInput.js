exports.parseInput = ({
    payload,
    profile, 
    normalizer
}) => (req, res, next) => {
    try {
        let freshPayload = payload;
        if (!payload) {
            freshPayload = req.method === 'GET' ? (req.query || {}) : (req.body || {})
        }

        const { clean, rejected } = normalizer(freshPayload, profile);
        req.parsed = {
            profile,
            ...clean
        };
        next();
    } catch (err) {
        next(err);
    }
};