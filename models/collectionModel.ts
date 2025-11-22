import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";

const collectionSchema = new Schema({
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
            type: Schema.ObjectId,
            ref: 'Recipe',
        }
    ],
    author: {
        type: Schema.ObjectId,
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

// Instance methods
const collectionInstanceMethods = {};

// Apply the methods to schema
collectionSchema.methods = collectionInstanceMethods;

// Plain DB shape (no mongoose methods, no _id)
export type CollectionDbRaw = InferSchemaType<typeof collectionSchema>;

type CollectionInstanceMethods = typeof collectionInstanceMethods;

// Everything is allowed to be undefined in code
type CollectionDb = Partial<CollectionDbRaw>;

// Hydrated Mongoose document (what queries actually return)
export type CollectionDoc = HydratedDocument<CollectionDbRaw> & CollectionDb & CollectionInstanceMethods;

// Domain / API type: plain object + `id: string`
export type Collection = CollectionDb & { id: string };

// 4) The model
export const CollectionModel = model<CollectionDb>("Collection", collectionSchema);