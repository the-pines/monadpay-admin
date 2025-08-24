"use client";

import { ReactNode, useEffect } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID as string;
const monadRpc = process.env.NEXT_PUBLIC_MONAD_RPC_URL as string;
const monadExplorer =
  (process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL as string) ||
  "https://explorer.monad.xyz";
const monadChainId = Number(
  process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ||
    process.env.NEXT_PUBLIC_CHAIN_ID ||
    10143
);

const monadTestnet = defineChain({
  id: monadChainId,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [monadRpc] },
    public: { http: [monadRpc] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: monadExplorer },
  },
});

const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks: [monadTestnet],
  projectId,
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(monadRpc),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!projectId) return;
    const instance = createAppKit({
      adapters: [wagmiAdapter],
      projectId,
      networks: [monadTestnet],
      defaultNetwork: monadTestnet,
      features: {
        email: false,
      },
      themeMode: "light",
      metadata: {
        name: "Admin Dashboard",
        description: "Mint/Burn points",
        url: "http://localhost:3000",
        icons: ["/favicon.ico"],
      },
    });
    (window as any).appKit = instance;
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig ?? wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
