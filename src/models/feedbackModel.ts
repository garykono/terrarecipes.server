import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";

const feedbackSchema = new Schema({
    message: {
        type: String,
        required: true,
        maxLength: [3000, 'Feedback cannot exceed 3000 characters.']
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
const feedbackInstanceMethods = {};

// Apply the methods to schema
feedbackSchema.methods = feedbackInstanceMethods;

// Plain DB shape (no mongoose methods, no _id)
export type feedbackDbRaw = InferSchemaType<typeof feedbackSchema>;

type feedbackInstanceMethods = typeof feedbackInstanceMethods;

// Everything is allowed to be undefined in code
type feedbackDb = Partial<feedbackDbRaw>;

// Hydrated Mongoose document (what queries actually return)
export type feedbackDoc = HydratedDocument<feedbackDbRaw> & feedbackDb & feedbackInstanceMethods;

// Domain / API type: plain object + `id: string`
export type feedback = feedbackDb & { id: string };

// 4) The model
export const feedbackModel = model<feedbackDb>("feedback", feedbackSchema);