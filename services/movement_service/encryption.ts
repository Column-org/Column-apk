/**
 * Encryption/Decryption utilities for transfer codes
 * Matches the Move contract's encrypt_code function exactly
 */

/**
 * Decrypt the encrypted code from event using sender's address
 * This reverses the XOR encryption done in the smart contract
 */
export function decryptCode(encryptedHex: string, senderAddress: string): string {
  try {
    // 1. Normalize senderAddress (ensure 32 bytes/64 chars hex)
    const cleanAddress = senderAddress.toLowerCase().replace('0x', '');
    const paddedAddress = cleanAddress.padStart(64, '0');

    // 2. Normalize encryptedHex (the code)
    // Some indexers prepend 0x or strip leading zeros
    let cleanHex = encryptedHex.toLowerCase().replace('0x', '');
    if (cleanHex.length % 2 !== 0) {
      cleanHex = '0' + cleanHex;
    }

    // Convert hex string to bytes
    const encryptedBytes: number[] = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byteHex = cleanHex.substring(i, i + 2);
      encryptedBytes.push(parseInt(byteHex, 16));
    }

    // Convert address hex to bytes
    const addressBytes: number[] = [];
    for (let i = 0; i < paddedAddress.length; i += 2) {
      const byteHex = paddedAddress.substring(i, i + 2);
      addressBytes.push(parseInt(byteHex, 16));
    }

    // XOR decrypt
    const decryptedBytes: number[] = [];
    for (let i = 0; i < encryptedBytes.length; i++) {
      const addressByte = addressBytes[i % addressBytes.length];
      decryptedBytes.push(encryptedBytes[i] ^ addressByte);
    }

    // Convert bytes to string
    return String.fromCharCode(...decryptedBytes);
  } catch (error) {
    console.error('Decryption error:', error, {
      encryptedHex,
      senderAddress,
    });
    throw new Error('Failed to decrypt code. Please check the encrypted value and sender address.');
  }
}

/**
 * Encrypt code with sender's address (for testing/verification)
 * Matches the Move contract's encrypt_code function
 */
export function encryptCode(code: string, senderAddress: string): string {
  // Remove '0x' prefix and convert to lowercase
  const cleanAddress = senderAddress.toLowerCase().startsWith('0x')
    ? senderAddress.slice(2).toLowerCase()
    : senderAddress.toLowerCase();

  // Pad address to 64 characters (32 bytes)
  const paddedAddress = cleanAddress.padStart(64, '0');

  // Convert code to bytes
  const codeBytes: number[] = [];
  for (let i = 0; i < code.length; i++) {
    codeBytes.push(code.charCodeAt(i));
  }

  // BCS serialization of Aptos address: just 32 bytes (NO length prefix for fixed-size types)
  const addressBytes: number[] = [];
  for (let i = 0; i < paddedAddress.length; i += 2) {
    addressBytes.push(parseInt(paddedAddress.substr(i, 2), 16));
  }

  // XOR encrypt
  const encryptedBytes: number[] = [];
  for (let i = 0; i < codeBytes.length; i++) {
    const addressByte = addressBytes[i % addressBytes.length];
    encryptedBytes.push(codeBytes[i] ^ addressByte);
  }

  // Convert to lowercase hex string (matching Move contract)
  return encryptedBytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Test encryption/decryption
 * Call this in browser console to verify the implementation
 */
export function testEncryption(code?: string, address?: string) {
  const testCode = code || "ed9141d90";
  const testAddress = address || "0xed9141d9f034c72cd74cf8324ef0d2a04ff27f69766cded093e9f2f225f2d59c";

  console.log("=== Encryption Test ===");
  console.log("Original code:", testCode);
  console.log("Sender address:", testAddress);

  const encrypted = encryptCode(testCode, testAddress);
  console.log("Encrypted (hex):", encrypted);

  const decrypted = decryptCode(encrypted, testAddress);
  console.log("Decrypted:", decrypted);

  const match = testCode === decrypted;
  console.log("Match:", match ? "✓ SUCCESS" : "✗ FAILED");

  return match;
}
