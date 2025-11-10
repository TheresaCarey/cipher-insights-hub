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
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [localhost, sepolia, mainnet, polygon],
  ssr: false,
});

export const SUPPORTED_CHAIN_IDS = [31337, 11155111];

export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case 31337:
      return 'Localhost';
    case 11155111:
      return 'Sepolia';
    default:
      return 'Unknown';
  }
}

export function getChainRpcUrl(chainId: number): string {
  switch (chainId) {
    case 31337:
      return 'http://localhost:8545';
    case 11155111:
      return 'https://sepolia.infura.io/v3/';
    default:
      return '';
  }
}

