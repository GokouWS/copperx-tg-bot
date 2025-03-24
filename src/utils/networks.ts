// src/utils/networks.ts

export const NETWORK_IDS = new Map<string, string>([
  ["1", "Ethereum Mainnet"], // Ethereum
  ["5", "Goerli"], // Ethereum Testnet
  ["11155111", "Sepolia"], // Ethereum Testnet
  ["137", "Polygon"], // Polygon
  ["80001", "Mumbai"], // Polygon Testnet
  ["56", "BNB Smart Chain Mainnet"], // Binance Smart Chain
  ["97", "BNB Smart Chain Testnet"], // Binance Smart Chain Testnet
  ["42161", "Arbitrum One"], // Arbitrum
  ["421613", "Arbitrum Goerli"], // Arbitrum Testnet
  ["43114", "Avalanche C-Chain"], // Avalanche
  ["43113", "Avalanche Fuji Testnet"], // Avalanche Testnet
  ["10", "Optimism Mainnet"], // Optimism
  ["420", "Optimism Goerli"], // Optimism Testnet
  ["250", "Fantom Opera"], // Fantom
  ["4002", "Fantom Testnet"], // Fantom Testnet
  ["1284", "Moonbeam"], // Moonbeam
  ["1287", "Moonbase Alpha"], // Moonbeam Testnet
  ["25", "Cronos Mainnet"], // Cronos
  ["338", "Cronos Testnet"], // Cronos Testnet
  ["1313161554", "Aurora Mainnet"], // Aurora
  ["1313161555", "Aurora Testnet"], // Aurora Testnet
  ["8453", "Base"], // Base Mainnet
  ["84531", "Base Goerli Testnet"], //Base Testnet
  ["5000", "Mantle Mainnet"], // Mantle
  ["5001", "Mantle Testnet"], // Mantle Testnet
  ["592", "Astar"], // Astar
  ["81", "Shiden"], // Shiden
  ["7700", "Canto"], // Canto Mainnet
  ["1666600000", "Harmony Mainnet Shard 0"],
  ["1666700000", "Harmony Testnet Shard 0"],
  ["1285", "Moonriver"],
  ["42220", "Celo Mainnet"], // Celo
  ["44787", "Celo Alfajores Testnet"], // Celo Testnet
  ["62320", "Celo Baklava Testnet"], // Celo Testnet
  ["534352", "Scroll"], //Scroll mainet
  ["534351", "Scroll Sepolia"], //Scroll testnet
  ["324", "zkSync Era Mainnet"], // zkSync Era Mainnet
  ["280", "zkSync Era Goerli Testnet"], // zkSync Era Goerli Testnet
  ["1088", "Metis Andromeda Mainnet"], // Metis Mainnet
  ["588", "Metis Stardust Testnet"], // Metis testnet
  ["1101", "Polygon zkEVM"], // Polygon zkEVM
  ["1442", "Polygon zkEVM Testnet"],
  ["23434", "Starknet"], // Starknet
  // Add more networks as needed.
]);

// Utility function to get a network name from an ID
export function getNetworkName(chainId: string | number): string {
  const chainIdStr = String(chainId);
  return NETWORK_IDS.get(chainIdStr) || chainIdStr;
}
