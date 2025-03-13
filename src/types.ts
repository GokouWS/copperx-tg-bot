export type Balance = {
  decimals: number;
  balance: string;
  symbol: string;
  address: string;
};

export type Wallet = {
  walletId: string;
  isDefault: boolean;
  network: string;
  balances: Balance[];
};

export type WalletsResponse = Wallet[];
