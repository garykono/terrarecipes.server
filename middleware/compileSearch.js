const { buildSearch } = require("../utils/searchUtils/builders/buildSearch");

exports.compileSearch = (
    profileMaps
) => (req, res, next) => {
    req.options = {
        ...buildSearch({
            profileMaps,
            ...req.parsed
        })
    }

    next();
}
