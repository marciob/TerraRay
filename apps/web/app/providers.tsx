"use client";

import type React from "react";
import { DemoProvider } from "./lib/demo-context";
import { Web3Provider } from "./web3-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <DemoProvider>{children}</DemoProvider>
    </Web3Provider>
  );
}
