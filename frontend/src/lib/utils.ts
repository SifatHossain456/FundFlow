import { formatEther, parseEther } from "viem";

export function formatETH(wei: bigint, decimals = 4): string {
  const eth = parseFloat(formatEther(wei));
  return eth.toFixed(decimals).replace(/\.?0+$/, "");
}

export function toWei(eth: string): bigint {
  try { return parseEther(eth); } catch { return 0n; }
}

export function formatDeadline(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}

export function timeLeft(deadline: bigint): string {
  const diff = Number(deadline) * 1000 - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
}

export function progressPercent(raised: bigint, target: bigint): number {
  if (target === 0n) return 0;
  return Math.min(100, Math.round(Number((raised * 100n) / target)));
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
