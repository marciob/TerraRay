import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { type Chain } from 'viem';

const raylsTestnet = {
  id: 123123,
  name: 'Rayls Testnet',
  nativeCurrency: { name: 'USDgas', symbol: 'USDgas', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://devnet-rpc.rayls.com'] },
  },
  blockExplorers: {
    default: { name: 'Rayls Explorer', url: 'https://devnet-explorer.rayls.com' },
  },
  testnet: true,
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'TerraRay',
  projectId: 'YOUR_PROJECT_ID', // We can use a placeholder or leave it as 'YOUR_PROJECT_ID' for demo
  chains: [raylsTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

