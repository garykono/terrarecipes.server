// Parses a search string into tokens and detects AND/OR groups + phrases in quotes
exports.parseSearchString = (input) => {
    if (!input || typeof input !== "string") return [];

    // Match quoted phrases OR unquoted tokens
    const regex = /"([^"]+)"|(\S+)/g;
    const tokens = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
        // match[1] = quoted phrase, match[2] = unquoted word
        tokens.push(match[1] || match[2]);
    }

    // Separate AND / OR operators and group them
    let currentGroup = [];
    const groups = [];
    let mode = "$and"; // Default mode

    tokens.forEach((token) => {
        const lower = token.toLowerCase();
        if (lower === "or") {
            // Flush current group if switching to OR
            if (currentGroup.length) {
                groups.push({ mode, terms: currentGroup });
                currentGroup = [];
            }
            mode = "$or";
        } else if (lower === "and") {
            // Flush current group if switching to AND
            if (currentGroup.length) {
                groups.push({ mode, terms: currentGroup });
                currentGroup = [];
            }
            mode = "$and";
        } else {
            currentGroup.push(token);
        }
    });

    if (currentGroup.length) {
        groups.push({ mode, terms: currentGroup });
    }

    return groups;
};