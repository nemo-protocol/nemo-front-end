"use client"
import { cn, getIsMobile } from "@/lib/utils"

import { useEffect, useState } from "react"
import copy from "clipboard-copy"
import { IS_DEV } from "@/config"
import { motion } from "framer-motion"
import { truncateStr } from "@/lib/utils"
import { useToast } from "@/components/Toast"
import { usePathname } from "next/navigation"

import { ChevronDown, LayoutGrid, Settings } from "lucide-react"
import { ConnectModal, useWallet } from "@nemoprotocol/wallet-kit"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import RpcSelectorMenu from "./RpcSelectorMenu"
import { useJwtStore } from "@/stores/jwt"
const MENU: {
  label: string
  href: string
  icon?: string
  liCls?: string
}[] = [
  { label: "Markets", href: "/market", icon: "/header/markets.svg" },
  { label: "My Portfolio", href: "/portfolio", icon: "/header/portfolio.svg" },
  { label: "Points", href: "/points", icon: "/header/star.svg" },
  // { label: "Swap", href: "/swap", icon: "/header/swap.svg" },
  // { label: 'Learn', href: '/learn', icon: '/header/learn.svg' },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: "/header/leaderboard.svg",
  },
  // {
  //   label: "Vaults",
  //   href: "/vaults",
  //   icon: "/header/vaults.svg",
  // },
  // { label: "Airdrop", href: "/airdrop", icon: "/header/airdrop.svg" },
]

export default function Header({ className }: { className?: string }) {
  const toast = useToast()
  const location = usePathname()
  const { address, disconnect, account: currentAccount } = useWallet()
  const [open, setOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { setActiveUser } = useJwtStore()

  const copyToClipboard = async (text: string) => {
    try {
      await copy(text)
      toast.success("Address copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy address")
    }
  }

  useEffect(() => {
    // 当地址改变时，设置活跃用户
    if (address) {
      setActiveUser(address)
    }
  }, [address, setActiveUser])

  return (
    <header className={cn("h-24.5 shrink-0", className)}>
      <div
        className=" w-full h-full mx-auto flex bg-[#080E16] justify-between text-xs"
        style={{ padding: getIsMobile() ? "16px 15px" : "32px 30px" }}
      >
        <div className="flex items-center gap-x-14">
          <Link href="/" className="flex gap-x-2 items-center">
            <Image
              src="/logo-nemo.svg"
              alt="logo"
              className="w-26 h-auto"
              width={106}
              height={32}
            />
          </Link>

          <ul className="md:flex gap-x-4 items-center hidden h-full text-[14px] font-[500]">
            {MENU.map(({ label, href, icon, liCls = "" }) => {
              const active = location === href

              return (
                <li key={href} className={liCls}>
                  <Link
                    href={href}
                    className={`
                flex items-center gap-x-2 px-3 py-2 rounded-full
                transition-colors duration-200
                ${
                  active
                    ? "bg-gradient-to-r from-white/10 to-white/5 text-white"
                    : "text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5"
                }
              `}
                  >
                    {icon && (
                      <Image
                        src={icon}
                        alt=""
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    )}
                    <span>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="flex items-center gap-x-2 sm:gap-x-2 h-full">
          <span
            className={[
              "relative h-full text-center cursor-pointer items-center justify-center",
              "bg-transparent md:flex hidden",
            ].join(" ")}
          ></span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex hover:text-white text-white/60 transition-colors rounded-full
            duration-200 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 p-2 items-center gap-x-1 border-none outline-none"
            >
              <Settings className="size-4.5 " />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl border border-[#3F3F3F] bg-[#0E1520] backdrop-blur animate-fade-in">
              <RpcSelectorMenu />
            </DropdownMenuContent>
          </DropdownMenu>
          {location === "/swap" ? null : currentAccount?.address ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex text-white/60 hover:text-white  text-[14px] font-[500] transition-colors duration-200 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 
              items-center gap-x-2 border-none outline-none bg-light-gray/[0.03] rounded-full  px-3 py-2"
              >
                {currentAccount?.address ? (
                  <div className="size-4 bg-[#F80] rounded-full"></div>
                ) : (
                  <Image
                    src="/assets/images/wallet.svg"
                    alt="wallet"
                    className="size-4"
                    width={16}
                    height={16}
                  />
                )}
                <span className="">
                  {truncateStr(currentAccount?.address || "", 4)}
                </span>
                <ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="rounded-xl border border-[#3F3F3F] bg-[#0E1520] backdrop-blur animate-fade-in"
                align="end"
              >
                <DropdownMenuItem className="p-1">
                  <button
                    onClick={() => disconnect()}
                    className="px-2 py-1.5 hover:bg-[#131520]  transition-colors text-white/60 hover:bg-gray-700/60 hover:text-white rounded-md cursor-pointer text-center w-full h-8"
                  >
                    Disconnect
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-1">
                  <button
                    onClick={() =>
                      copyToClipboard(currentAccount?.address || "")
                    }
                    className="px-2 py-1.5 hover:bg-[#131520]  transition-colors text-white/60 hover:bg-gray-700/60 hover:text-white rounded-md cursor-pointer text-center w-full h-8"
                  >
                    Copy Address
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ConnectModal
              theme="dark"
              open={open}
              onOpenChange={(isOpen: boolean) => setOpen(isOpen)}
              // trigger={
              //   <button
              //     disabled={!!currentAccount}
              //     className="text-white outline-none py-2 px-3 rounded-3xl bg-[#0052F2]"
              //   >
              //     <span className="hidden md:inline-block">Connect Wallet</span>
              //     <span className="inline-block md:hidden text-xs">
              //       Connect
              //     </span>
              //   </button>
              // }
            >
              <button
                disabled={!!currentAccount}
                className="bg-light-gray/[0.03] text-white flex gap-x-1 items-center justify-center cursor-pointer outline-none py-2 px-2.5 rounded-full"
              >
                <Image
                  src={"/assets/images/wallet.svg"}
                  alt="icon"
                  className="size-4"
                  width={16}
                  height={16}
                />{" "}
                <span className="hidden md:inline-block"> Connect Wallet</span>
                <span className="inline-block md:hidden text-xs">Connect</span>
              </button>
            </ConnectModal>
          )}
          <LayoutGrid // todo 替换移动端icon
            className="md:hidden text-white cursor-pointer"
            onClick={() => setIsOpen((isOpen) => !isOpen)}
          />
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-[#0E0F16]/90 md:hidden"
          style={{ top: "64px" }}
        />
      )}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: "hidden" }}
        className="absolute left-0 right-0 text-sm md:hidden bg-[#0E0F16]/90 backdrop-blur-md relative z-10"
      >
        <div className="flex flex-col py-3 max-w-[1440px] mx-auto px-4">
          <Link
            href="/market"
            className="py-3 text-white/90 hover:text-white text-base"
          >
            Markets
          </Link>
          <Link
            href="/portfolio"
            className="py-3 text-white/90 hover:text-white text-base"
          >
            Portfolio
          </Link>
          <Link
            href="/learn"
            className="py-3 text-white/90 hover:text-white text-base"
          >
            Learn
          </Link>
          <Link
            href="/points"
            className="py-3 text-white/90 hover:text-white text-base"
          >
            Points
          </Link>
          <Link
            href="/mint"
            className="py-3 text-white/90 hover:text-white text-base"
          >
            Mint
          </Link>
          <a
            href="https://www.sentio.xyz/"
            target="_blank"
            className="py-3 text-white/90 hover:text-white text-base"
          >
            Sentio
          </a>
          {IS_DEV && (
            <Link
              href="/test"
              className="py-3 text-white/90 hover:text-white text-base"
            >
              Test
            </Link>
          )}
        </div>
      </motion.div>
    </header>
  )
}
