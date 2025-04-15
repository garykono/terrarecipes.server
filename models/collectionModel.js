const mongoose = require('mongoose')

const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A collection must have a name.'],
        trim: true,
        maxLength: [50, 'A collection name must have 50 or less characters.']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [300, 'A collection description must have 300 or less characters.']
    },
    recipes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Recipe',
        }
    ],
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A collection must have the author\'s id.']
    },
    createdAt: {
        type: Date,
        // Mongoose automatically translates this to a readable date
        default: Date.now(),
        // Ignores it in all queries (but still shows up in database)
        select: false
    }
}, {
    toJSON: { virtuals : true },
    toObject: { virtuals : true }
});

const Collection = mongoose.model('Collection', collectionSchema);

module.exports = Collection;