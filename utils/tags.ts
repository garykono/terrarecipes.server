import { StandardTags } from "../types/standardized";

export const flattenTags = (tags: StandardTags) =>
    [...Object.values(tags?.facets ?? {}).flat(), ...(tags?.custom ?? [])];
