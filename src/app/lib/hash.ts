/**
 * File Hashing Utilities
 * Uses SHA-256 (H256) format for blockchain compatibility
 */

/**
 * Hash a file using SHA-256
 * @param file File to hash
 * @returns Hex-encoded hash with 0x prefix (H256 format)
 */
export async function hashFile(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (err) {
    console.error('❌ Failed to hash file:', err);
    throw new Error('File hashing failed');
  }
}

/**
 * Hash a string using SHA-256
 * @param text Text to hash
 * @returns Hex-encoded hash with 0x prefix
 */
export async function hashString(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (err) {
    console.error('❌ Failed to hash string:', err);
    throw new Error('String hashing failed');
  }
}
