export function formatNumber(num: number | undefined | null, decimals = 2): string {
  if (num === undefined || num === null) return '-';

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
}

export function formatUsd(num: number | undefined | null, decimals = 2): string {
  if (num === undefined || num === null) return '-';
  return `$${formatNumber(num, decimals)}`;
}

export function formatPercent(num: number | undefined | null, decimals = 2): string {
  if (num === undefined || num === null) return '-';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export function formatPrice(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-';

  if (num < 0.00001) {
    return `$${num.toExponential(2)}`;
  }
  if (num < 0.01) {
    return `$${num.toFixed(6)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(4)}`;
  }
  return `$${num.toFixed(2)}`;
}

export function formatAge(timestamp: number | undefined | null): string {
  if (!timestamp) return '-';

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  if (days < 30) {
    return `${days}d`;
  }
  return `${Math.floor(days / 30)}mo`;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
