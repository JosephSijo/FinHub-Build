/**
 * Hashes a string using SHA-256.
 * Used primarily for secure identification in client-side storage.
 */
export const hashPin = async (val: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(val);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
