/**
 * Pinata IPFS Upload Utilities
 *
 * Requires PINATA_JWT environment variable
 * Get your JWT from: https://app.pinata.cloud/developers/api-keys
 */

interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Upload a file to Pinata IPFS
 * @param file File to upload
 * @param name Optional name for the file
 * @returns IPFS CID (Content Identifier)
 */
export async function uploadToPinata(file: File, name?: string): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!jwt) {
    throw new Error('PINATA_JWT not found in environment variables. Please add NEXT_PUBLIC_PINATA_JWT to .env.local');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: name || file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type || 'application/octet-stream',
        fileName: file.name
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add options
    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    console.log('📤 Uploading to Pinata IPFS:', file.name);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinata upload failed:', errorText);
      throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
    }

    const result: PinataUploadResponse = await response.json();
    console.log('✅ Uploaded to IPFS:', result.IpfsHash);

    return result.IpfsHash;
  } catch (error) {
    console.error('❌ Error uploading to Pinata:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid IPFS Content Identifier
 * @returns Full gateway URL
 */
export function getIpfsGatewayUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Check if Pinata is configured
 * @returns true if JWT is available
 */
export function isPinataConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PINATA_JWT;
}
