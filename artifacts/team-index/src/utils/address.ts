/** Shorten a wallet address to "0x1234…abcd" */
export function truncateAddr(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
