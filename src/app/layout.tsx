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
import { SuiMainnetChain, WalletProvider, useWallet } from "@nemoprotocol/wallet-kit"
import "@nemoprotocol/wallet-kit/style.css"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import TransactionStatusDialog from "@/components/TransactionStatusDialog"
import { useDialogStore } from "@/lib/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useJwtStore } from "@/stores/jwt"
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

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { address } = useWallet()
  const { current } = useJwtStore()
  
  // 检查是否需要授权
  const needsAuthorization = address && (!current || current.address !== address)
  
  if (needsAuthorization) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto bg-[#0052F2]/10 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-[#0052F2]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
                     <h2 className="text-xl font-semibold text-white">Authorization Required</h2>
           <p className="text-white/60 text-sm leading-relaxed">
             Your wallet is connected successfully, but you need to authorize access to use Nemo Protocol features.
             Please click the &quot;Authorize&quot; button in the top-right corner to proceed.
           </p>
           <div className="flex items-center justify-center gap-2 text-xs text-white/40">
             <span>💡</span>
             <span>You&apos;ll need to sign a message to verify your identity</span>
           </div>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

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
      <body className="font-sans min-h-screen flex flex-col">
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
                    <section className="flex-1">
                      <AuthWrapper>{children}</AuthWrapper>
                    </section>
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
