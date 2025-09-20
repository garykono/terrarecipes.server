export const flattenTags = tags =>
    [...Object.values(tags?.facets ?? {}).flat(), ...(tags?.custom ?? [])];
