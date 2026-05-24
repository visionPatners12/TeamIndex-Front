type WalletLike = {
  address?: string | null;
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
