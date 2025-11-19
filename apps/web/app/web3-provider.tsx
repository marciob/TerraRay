"use client";

import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, cookieStorage, createStorage, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

// Polyfill for SSR (RainbowKit/CoinbaseWallet bug)
if (typeof window === "undefined") {
  const noop = () => {};
  // @ts-ignore
  global.indexedDB = {
    open: () =>
      ({
        result: { close: noop, createObjectStore: () => ({} as any) },
        addEventListener: noop,
        removeEventListener: noop,
        onsuccess: noop,
        onerror: noop,
      } as any),
  };
}

// Define Rayls Testnet
const raylsTestnet = {
  id: 123123,
  name: "Rayls Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDgas",
    symbol: "USDgas",
  },
  rpcUrls: {
    default: { http: ["https://devnet-rpc.rayls.com"] },
  },
  blockExplorers: {
    default: {
      name: "Rayls Explorer",
      url: "https://devnet-explorer.rayls.com",
    },
  },
  testnet: true,
} as const;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Memoize config and queryClient to prevent re-initialization
  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "TerraRay",
        projectId: "YOUR_PROJECT_ID",
        chains: [raylsTestnet],
        ssr: true,
        storage: createStorage({
          storage: cookieStorage,
        }),
        transports: {
          [raylsTestnet.id]: http(),
        },
      }),
    []
  );

  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#D9F94F", // Rayls Lime
            accentColorForeground: "black",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
