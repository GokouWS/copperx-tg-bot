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

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
  organizationId: string;
  role: "owner";
  status: "pending";
  type: "individual";
  relayerAddress: string;
  flags: string[];
  walletAddress: string;
  walletId: string;
  walletAccountType: string;
};
