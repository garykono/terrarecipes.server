import { Schema } from "mongoose";

export const tagsSchema = new Schema(
    {
        facets: {
            type: Map,
            of: [String],
            default: () => ({}),
        },
        custom: {
            type: [String],
            default: () => [],
        },
    },
    {
        _id: false, // no _id for tags
        id: false,  // no automatic id virtual either
    }
);