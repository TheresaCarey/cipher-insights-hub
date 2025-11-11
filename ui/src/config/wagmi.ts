import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Define localhost chain with correct chainId (31337 for Hardhat)
const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
});

export const config = getDefaultConfig({
  appName: 'Cipher Insights Hub',
  projectId: 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [localhost, sepolia, mainnet, polygon],
  ssr: false,
});

