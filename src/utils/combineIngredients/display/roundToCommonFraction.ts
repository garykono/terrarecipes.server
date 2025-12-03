/**
 * Round to a cleaner fraction for readability.
 */
export function roundToCommonFraction(value: number): number {
    const fractions = [0, 0.25, 0.5, 0.75, 1];
    const integer = Math.floor(value);
    const decimal = value - integer;
    const closest = fractions.reduce((prev, curr) =>
        Math.abs(curr - decimal) < Math.abs(prev - decimal) ? curr : prev
    );
    return +(integer + closest).toFixed(2);
}