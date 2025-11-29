import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
import { tagsSchema } from "./subDocuments/tagsSchema";

const recipeSchema = new Schema({
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
        maxLength: [300, 'A recipe description must have 300 or less characters.'],
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    servings: {
        type: Number,
        default: null
    },
    prepTimeMin: {
        type: Number,
        default: null
    },
    cookTimeMin: {
        type: Number,
        default: null
    },
    restTimeMin: {
        type: Number,
        default: null
    },
    totalTimeMin: {
        type: Number,
        default: null
    },
    ingredients: {
        type: [{
            text: String,
            isSection: Boolean,
            // parsed is in an array because more than 1 ingredient can be parsed from an ingredient input
            parsed: [{
                quantity: Number,
                unit: String,
                ingredient: String,
                forms: [String],
                preparations: [String],
                size: {
                    type: String,
                    enum: ["small", "medium", "large"]
                },
                isOptional: Boolean,
                optionalQuantity: Boolean,
                isSubstitute: Boolean,
                raw: String,
                parsedBy: {
                    type: String,
                    enum: ['manual', 'fallback', 'initialized']
                },
                _id: false
            }],
            _id: false,
        }],
        validate: {
            validator: function(el: any) {
                return Array.isArray(el) && el.length > 0
            },
            message: 'A recipe must have at least 1 ingredient.'
        },
        default: []
    },
    directions: {
        type: [{
            text: String,
            isSection: Boolean
        }],
        default: []
    },
    tags: {
        type: tagsSchema,
        default: () => ({
            facets: {},
            custom: [],
        }),
    },
    tagsFlat: { 
        type: [String], 
        index: true
    },
    credit: {
        type: String,
        default: "",
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User',
        required: [true, 'A recipe must have the author\'s id.']
    },
    createdAt: {
        type: Date,
        // Mongoose automatically translates this to a readable date
        default: Date.now()
    },
}, {
    toJSON: { virtuals : true },
    toObject: { virtuals : true },
});

// Virtual `id` field that maps `_id` → `id` (string)
recipeSchema.virtual("id").get(function (this: { _id: unknown }) {
  // Mongoose ObjectId has toString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (this._id as any)?.toString();
});

// Recipe.on('index', function(err) {
//     if (err) {
//         console.error('User index error: %s', err);
//     } else {
//         console.info('User indexing complete');
//     }
// });

// Instance methods
const recipeInstanceMethods = {};

// Apply the methods to schema
recipeSchema.methods = recipeInstanceMethods;


// Plain DB shape (no mongoose methods, no _id)
type RecipeDbRaw = InferSchemaType<typeof recipeSchema>;

type RecipeInstanceMethods = typeof recipeInstanceMethods;

// Everything is allowed to be undefined in code
type RecipeDb = Partial<RecipeDbRaw>;

// Hydrated Mongoose document (what queries actually return)
export type RecipeDoc = HydratedDocument<RecipeDbRaw> & RecipeDb & RecipeInstanceMethods;

// Domain / API type: plain object + `id: string`
export type Recipe = RecipeDb & { id: string };

// The model
export const RecipeModel = model<RecipeDb>("Recipe", recipeSchema);