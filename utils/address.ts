/**
 * Normalizes Aptos/Movement blockchain addresses for comparison
 *
 * The blockchain sometimes strips leading zeros from addresses,
 * so we need to normalize them before comparing.
 *
 * @param address - The address to normalize (with or without 0x prefix)
 * @returns Normalized address (64 characters, lowercase, no 0x prefix)
 *
 * @example
 * normalizeAddress('0x5de09044...') // returns '05de09044...' (padded to 64 chars)
 * normalizeAddress('0x05de09044...') // returns '05de09044...' (same result)
 */
export function normalizeAddress(address: string): string {
  const cleaned = address.toLowerCase().replace('0x', '')
  return cleaned.padStart(64, '0')
}

/**
 * Compares two addresses for equality, handling leading zero differences
 *
 * @param addr1 - First address
 * @param addr2 - Second address
 * @returns true if addresses are equal after normalization
 */
export function compareAddresses(addr1: string, addr2: string): boolean {
  return normalizeAddress(addr1) === normalizeAddress(addr2)
}
