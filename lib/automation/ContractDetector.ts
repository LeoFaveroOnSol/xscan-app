/**
 * Contract Address Detector
 *
 * Detects Solana contract addresses in text content
 */

import {
  AUTOMATION_CONFIG,
  isIgnoredAddress,
  automationLog,
} from './config';

export interface DetectedContract {
  address: string;
  context: string; // Text surrounding the address
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extract all potential Solana addresses from text
 */
export function extractAddresses(text: string): string[] {
  const regex = AUTOMATION_CONFIG.SOLANA_ADDRESS_REGEX;
  const matches = text.match(regex) || [];

  // Reset regex lastIndex for global regex
  regex.lastIndex = 0;

  // Filter unique addresses
  const uniqueAddresses = Array.from(new Set(matches));

  automationLog('debug', `Found ${uniqueAddresses.length} potential addresses in text`);

  return uniqueAddresses;
}

/**
 * Validate if a string is a valid Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded, 32-44 characters
  if (address.length < 32 || address.length > 44) {
    return false;
  }

  // Check for base58 characters only (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) {
    return false;
  }

  // Most Solana token addresses end with 'pump' (from pump.fun) or are 44 chars
  // But we'll accept any valid format
  return true;
}

/**
 * Calculate confidence score for a detected address
 */
function calculateConfidence(
  address: string,
  text: string,
  context: string
): 'high' | 'medium' | 'low' {
  const lowerContext = context.toLowerCase();
  const lowerText = text.toLowerCase();

  let score = 0;

  // High confidence indicators
  if (lowerContext.includes('ca:') || lowerContext.includes('ca :')) score += 3;
  if (lowerContext.includes('contract')) score += 2;
  if (lowerContext.includes('address')) score += 2;

  // Medium confidence indicators
  if (lowerText.includes('buy')) score += 1;
  if (lowerText.includes('ape')) score += 1;
  if (lowerText.includes('gem')) score += 1;
  if (lowerText.includes('call')) score += 1;
  if (lowerText.includes('entry')) score += 1;

  // Pump.fun addresses (end with 'pump')
  if (address.toLowerCase().endsWith('pump')) score += 2;

  // Address length (44 chars is most common for tokens)
  if (address.length === 44) score += 1;

  // Determine confidence level
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Get context around an address in text
 */
function getAddressContext(text: string, address: string, contextLength: number = 50): string {
  const index = text.indexOf(address);
  if (index === -1) return '';

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + address.length + contextLength);

  return text.substring(start, end);
}

/**
 * Detect contract addresses in text with filtering and validation
 */
export function detectContracts(text: string): DetectedContract[] {
  const addresses = extractAddresses(text);
  const detected: DetectedContract[] = [];

  for (const address of addresses) {
    // Skip if not valid format
    if (!isValidSolanaAddress(address)) {
      automationLog('debug', `Invalid address format: ${address.substring(0, 10)}...`);
      continue;
    }

    // Skip if in ignore list
    if (isIgnoredAddress(address)) {
      automationLog('debug', `Ignored known address: ${address.substring(0, 10)}...`);
      continue;
    }

    const context = getAddressContext(text, address);
    const confidence = calculateConfidence(address, text, context);

    detected.push({
      address,
      context,
      confidence,
    });

    automationLog('debug', `Detected CA: ${address.substring(0, 10)}... (${confidence} confidence)`);
  }

  // Sort by confidence (high first)
  detected.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });

  return detected;
}

/**
 * Detect the most likely contract address from a tweet
 * Returns the highest confidence address, or null if none found
 */
export function detectPrimaryContract(text: string): DetectedContract | null {
  const contracts = detectContracts(text);

  if (contracts.length === 0) {
    return null;
  }

  // Return highest confidence match
  // If multiple high confidence, prefer pump.fun addresses
  const highConfidence = contracts.filter(c => c.confidence === 'high');

  if (highConfidence.length > 0) {
    // Prefer pump.fun addresses
    const pumpAddress = highConfidence.find(c =>
      c.address.toLowerCase().endsWith('pump')
    );
    return pumpAddress || highConfidence[0];
  }

  // Return first medium confidence if no high
  const mediumConfidence = contracts.filter(c => c.confidence === 'medium');
  if (mediumConfidence.length > 0) {
    return mediumConfidence[0];
  }

  // Only return low confidence if explicitly tagged as CA
  const lowWithTag = contracts.find(c =>
    c.context.toLowerCase().includes('ca:') ||
    c.context.toLowerCase().includes('contract')
  );

  return lowWithTag || null;
}

/**
 * Extract multiple contract addresses for batch processing
 */
export function detectAllContracts(text: string, minConfidence: 'high' | 'medium' | 'low' = 'medium'): string[] {
  const contracts = detectContracts(text);

  const confidenceLevels = {
    high: ['high'],
    medium: ['high', 'medium'],
    low: ['high', 'medium', 'low'],
  };

  const allowedLevels = confidenceLevels[minConfidence];

  return contracts
    .filter(c => allowedLevels.includes(c.confidence))
    .map(c => c.address);
}
