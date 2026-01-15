import { config } from '@/config';

const BASE_URL = config.helius.baseUrl;

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  description: string;
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
    tokenStandard: string;
  }[];
  nativeTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
}

interface ParsedTransaction {
  signature: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer' | 'unknown';
  description: string;
  tokenMint?: string;
  tokenAmount?: number;
  solAmount?: number;
}

export async function getWalletTransactions(
  walletAddress: string,
  limit: number = 20
): Promise<ParsedTransaction[]> {
  if (!config.helius.apiKey) {
    console.warn('Helius API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/v0/addresses/${walletAddress}/transactions?api-key=${config.helius.apiKey}&limit=${limit}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return [];
    }

    const transactions: HeliusTransaction[] = await response.json();

    return transactions.map((tx) => {
      let type: ParsedTransaction['type'] = 'unknown';
      let tokenMint: string | undefined;
      let tokenAmount: number | undefined;
      let solAmount: number | undefined;

      // Parse token transfers
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        const transfer = tx.tokenTransfers[0];
        tokenMint = transfer.mint;
        tokenAmount = transfer.tokenAmount;

        // Determine if buy or sell based on direction
        if (transfer.toUserAccount === walletAddress) {
          type = 'buy';
        } else if (transfer.fromUserAccount === walletAddress) {
          type = 'sell';
        } else {
          type = 'transfer';
        }
      }

      // Parse native SOL transfers
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        const nativeTransfer = tx.nativeTransfers.find(
          (t) => t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress
        );
        if (nativeTransfer) {
          solAmount = nativeTransfer.amount / 1e9; // Convert lamports to SOL
        }
      }

      return {
        signature: tx.signature,
        timestamp: tx.timestamp * 1000, // Convert to milliseconds
        type,
        description: tx.description || 'Unknown transaction',
        tokenMint,
        tokenAmount,
        solAmount,
      };
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
}

export async function getWalletBalances(walletAddress: string) {
  if (!config.helius.apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/v0/addresses/${walletAddress}/balances?api-key=${config.helius.apiKey}`,
      { next: { revalidate: 120 } }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
