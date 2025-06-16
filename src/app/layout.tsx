"use client"

import "./globals.css"
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
import TransactionStatusDialog from "@/components/TransactionStatusDialog"
import { useDialogStore } from "@/lib/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
const queryClient = new QueryClient()

type Rpc = { id: string; name: string; url: string }
export const RPC_LIST: Rpc[] = [
  { id: "sui", name: "Sui Official", url: "https://fullnode.mainnet.sui.io/" },
  {
    id: "blockvision",
    name: "BlockVision",
    url: "https://sui-mainnet-endpoint.blockvision.org/",
  },
  { id: "suiscan", name: "SuiScan", url: "https://rpc-mainnet.suiscan.xyz/" },
  { id: "suiet", name: "Suiet", url: "https://mainnet.suiet.app/" },
  {
    id: "blast",
    name: "Blast",
    url: "https://sui-mainnet.blastapi.io/5e2b3e4f-dc83-432b-86d1-70fb73e88187",
  },
]

const current =
  typeof window === 'undefined'
    ? RPC_LIST[0].url
    : localStorage.getItem('RPC_ENDPOINT') || RPC_LIST[0].url;
const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: current,
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

  const { open, status, network, txId, message, onClose, hideDialog } =
    useDialogStore()

  useEffect(() => {
    if (pathname === "/") {
      router.push("/market")
    }
  }, [pathname, router])

  return (
    <html lang="en">
      <body className="font-sans">
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider
            networks={networkConfig}
            defaultNetwork={network as "mainnet" | "testnet"}
          >
            <WalletProvider autoConnect={true} chains={[SuiMainnetChain]}>
              <ToastProvider>
                <TooltipProvider>
                  <Toaster />
                  <AnimatePresence>
                    <Header key="header" />
                    <section>{children}</section>
                    <Footer key="footer" />
                  </AnimatePresence>
                </TooltipProvider>
              </ToastProvider>
              <TransactionStatusDialog
                open={open}
                status={status}
                network={network}
                txId={txId}
                message={message}
                onClose={() => {
                  hideDialog()
                  onClose?.()
                }}
              />
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
