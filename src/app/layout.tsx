"use client"

import "./globals.css"
import { network } from "@/config"
import { getFullnodeUrl } from "@mysten/sui/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Header from "@/components/Header"
import { ToastProvider } from "@/components/Toast"
import Footer from "@/components/Footer"
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit"
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresence } from "framer-motion"
import { SuiMainnetChain, WalletProvider } from "@nemoprotocol/wallet-kit"
import "@nemoprotocol/wallet-kit/style.css"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

const queryClient = new QueryClient()

const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: getFullnodeUrl("mainnet"),
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
  },
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === "/") {
      router.push("/market")
    }
  }, [pathname, router])

  return (
    <html lang="en">
      <body className="font-sans">
        <Toaster />
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider
            networks={networkConfig}
            defaultNetwork={network as "mainnet" | "testnet"}
          >
            <WalletProvider autoConnect={true} chains={[SuiMainnetChain]}>
              <ToastProvider>
                <AnimatePresence>
                  <Header key="header" />
                  <section>{children}</section>
                  <Footer key="footer" />
                </AnimatePresence>
              </ToastProvider>
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
