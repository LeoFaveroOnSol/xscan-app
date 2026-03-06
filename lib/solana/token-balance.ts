import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`;
const FALLBACK_RPC = 'https://api.mainnet-beta.solana.com';

// XSCAN token mint address — UPDATE THIS when token is deployed
const XSCAN_TOKEN_MINT = process.env.XSCAN_TOKEN_MINT || '';

// Minimum balance for holder perks (100k tokens)
const HOLDER_THRESHOLD = parseInt(process.env.XSCAN_HOLDER_THRESHOLD || '100000');

// SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

function getConnection(): Connection {
  const rpc = process.env.HELIUS_API_KEY ? HELIUS_RPC : FALLBACK_RPC;
  return new Connection(rpc, 'confirmed');
}

export interface TokenBalanceResult {
  wallet: string;
  mint: string;
  balance: number;       // raw token amount (no decimals)
  decimals: number;
  uiBalance: number;     // human-readable balance
  isHolder: boolean;     // meets threshold
  threshold: number;
}

/**
 * Get token balance for a wallet address using raw RPC
 * No @solana/spl-token dependency needed
 */
export async function getTokenBalance(
  walletAddress: string,
  mintAddress?: string
): Promise<TokenBalanceResult> {
  const mint = mintAddress || XSCAN_TOKEN_MINT;
  
  if (!mint) {
    throw new Error('XSCAN_TOKEN_MINT not configured');
  }

  const connection = getConnection();
  const wallet = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mint);

  // Get all token accounts for this wallet + mint
  const response = await connection.getTokenAccountsByOwner(wallet, {
    mint: mintPubkey,
  });

  if (response.value.length === 0) {
    return {
      wallet: walletAddress,
      mint,
      balance: 0,
      decimals: 6, // default for pump.fun tokens
      uiBalance: 0,
      isHolder: false,
      threshold: HOLDER_THRESHOLD,
    };
  }

  // Parse token account data (SPL Token Account layout)
  // Offset 64 = amount (u64 LE), we also need mint decimals
  const accountData = response.value[0].account.data;
  const data = Buffer.from(accountData);
  
  // Amount is at offset 64, 8 bytes, little-endian u64
  const rawAmount = data.readBigUInt64LE(64);

  // Get mint info for decimals
  const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
  let decimals = 6; // default
  if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
    decimals = mintInfo.value.data.parsed?.info?.decimals ?? 6;
  }

  const balance = Number(rawAmount);
  const uiBalance = balance / Math.pow(10, decimals);

  return {
    wallet: walletAddress,
    mint,
    balance,
    decimals,
    uiBalance,
    isHolder: uiBalance >= HOLDER_THRESHOLD,
    threshold: HOLDER_THRESHOLD,
  };
}

/**
 * Simple boolean check — is this wallet a holder?
 */
export async function isXscanHolder(walletAddress: string): Promise<boolean> {
  try {
    const result = await getTokenBalance(walletAddress);
    return result.isHolder;
  } catch {
    return false;
  }
}
