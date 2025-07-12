const mongoose = require('mongoose')

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A recipe must have a name.'],
        // Ignores case sensitivity when checking for uniqueness
        index: {
            unique: true,
            collation: { locale: 'en', strength: 2 }
        },
        trim: true,
        minLength: [5, 'A recipe name must have 5 or more characters.'],
        maxLength: [50, 'A recipe name must have 50 or less characters.'],
    },
    description: {
        type: String,
        trim: true,
        maxLength: [300, 'A recipe description must have 300 or less characters.']
    },
    image: String,
    ingredients: {
        type: [{
            text: String,
            isSection: Boolean,
            parsed: {
                quantity: Number,
                unit: String,
                ingredient: String,
                raw: String,
                forms: [String],
                preparations: [String],
                size: {
                    type: String,
                    enum: ["small", "medium", "large"]
                },
                parsedBy: {
                    type: String,
                    enum: ['manual', 'fallback', 'initialized']
                }
            }
        }],
        validate: {
            validator: function(el) {
                return Array.isArray(el) && el.length > 0
            },
            message: 'A recipe must have at least 1 ingredient.'
        }
    },
    directions: [{
        text: String,
        isSection: Boolean
    }],
    tags: [String],
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A recipe must have the author\'s id.']
    },
    createdAt: {
        type: Date,
        // Mongoose automatically translates this to a readable date
        default: Date.now()
    }
}, {
    toJSON: { virtuals : true },
    toObject: { virtuals : true },
});

const Recipe = mongoose.model('Recipe', recipeSchema);

// Recipe.on('index', function(err) {
//     if (err) {
//         console.error('User index error: %s', err);
//     } else {
//         console.info('User indexing complete');
//     }
// });

module.exports = Recipe;