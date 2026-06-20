type WalletLike = {
  address?: string | null;
  walletClientType?: string | null;
};

type PrivyUserLike = {
  smartWallet?: WalletLike | null;
  wallet?: WalletLike | null;
};

export function getPrimaryEvmAddress(
  user?: PrivyUserLike | null,
  wallets: WalletLike[] = []
) {
  return (
    user?.smartWallet?.address ??
    wallets.find((wallet) => !!wallet.address)?.address ??
    user?.wallet?.address ??
    null
  );
}

export function hasSmartWalletAddress(user?: PrivyUserLike | null) {
  return !!user?.smartWallet?.address;
}

export function getWalletForAddress(
  wallets: WalletLike[] = [],
  address?: string | null
) {
  if (!address) return wallets.find((wallet) => !!wallet.address) ?? null;
  const normalized = address.toLowerCase();
  return (
    wallets.find((wallet) => wallet.address?.toLowerCase() === normalized) ??
    null
  );
}
