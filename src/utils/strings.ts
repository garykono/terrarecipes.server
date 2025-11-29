export const escapeRx = (s: string) => String(s ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
