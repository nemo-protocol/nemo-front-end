"use client"

import { useState } from "react"
import { useWallet } from "@nemoprotocol/wallet-kit"
import { useJwtToken } from "@/queries"
import { useJwtStore } from "@/stores/jwt"
import { useToast } from "@/components/Toast"

interface AuthorizeButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  children?: React.ReactNode
}

export default function AuthorizeButton({
  className = "",
  variant = "default",
  size = "md",
  children
}: AuthorizeButtonProps) {
  const toast = useToast()
  const { mutateAsync: getJwtToken } = useJwtToken()
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { address, signPersonalMessage } = useWallet()
  const { setToken, setActiveUser } = useJwtStore()

  const handleAuthorize = async () => {
    if (!address || !signPersonalMessage) {
      toast.error("Wallet not connected")
      return
    }

    setIsAuthorizing(true)
    try {
      const now: string = Math.floor(Date.now() / 1000).toString()
      const content = `Welcome to Nemo Protocol!
By signing this message, you acknowledge and agree to the following terms:
1.Terms of Service: I have read, understood, and agree to the Nemo Protocol Terms of Service and Privacy Policy.
2.Geographic Restrictions: I confirm that I am NOT a citizen or resident of, nor am I accessing the protocol from, the U.S., China, Canada, UK, or any other restricted jurisdiction as defined in the Terms of Service.
3.Risk Acknowledgement: I understand the significant risks associated with DeFi, including but not limited to market risk, smart contract vulnerabilities, and the potential for total loss of funds. I assume all such risks myself. 

${now}`
      
      const msgBytes = new TextEncoder().encode(content)
      const msgUint8Array = new Uint8Array(msgBytes)
      const result = await signPersonalMessage({
        message: msgUint8Array,
      })

      const { authorization } = await getJwtToken({
        sign: result.signature,
        content,
      })

      setToken(authorization, now, address)
      setActiveUser(address)
      toast.success("Authorization successful")
    } catch (error) {
      console.error("Authorization failed:", error)
      toast.error("Authorization failed")
    } finally {
      setIsAuthorizing(false)
    }
  }

  // 基础样式类
  const baseClasses = "flex items-center justify-center cursor-pointer outline-none transition-colors duration-200 font-medium"
  
  // 变体样式
  const variantClasses = {
    default: "bg-[#0052F2] hover:bg-[#0052F2]/90 disabled:bg-[#0052F2]/50 text-white",
    outline: "border border-[#0052F2] text-[#0052F2] hover:bg-[#0052F2]/10 disabled:opacity-50",
    ghost: "text-[#0052F2] hover:bg-[#0052F2]/10 disabled:opacity-50"
  }
  
  // 尺寸样式
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-full",
    md: "px-4 py-2 text-sm rounded-full",
    lg: "px-6 py-3 text-base rounded-full"
  }

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <button
      onClick={handleAuthorize}
      disabled={isAuthorizing || !address}
      className={buttonClasses}
    >
      {isAuthorizing ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Authorizing...</span>
        </div>
      ) : (
        children || "Authorize"
      )}
    </button>
  )
} 