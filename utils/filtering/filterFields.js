// Maps model names to their allowed filter fields
exports.filterFields = {
    Recipe: ['name', 'tags', 'author', 'difficulty'],
    User: ['role', 'status', 'createdAt'],
    // Add more as needed
};