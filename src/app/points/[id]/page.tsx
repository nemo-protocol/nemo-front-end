"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface TabItem {
  id: string
  title: string
  description: string
  additionalInfo?: string
  metrics: {
    label: string
    value: string
  }
  icon: string
}

const vsuiTabs: TabItem[] = [
  {
    id: "yt",
    title: "YT-vSUI-250820",
    description:
      "Boost your points by buying YT at a cost. Along with YTs leverage, you get Volo points multipliers.",
    additionalInfo:
      "YT drops to zero at maturity, but you can exit anytime at its market price, keeping all earned points. These points can be redeemed for airdrop tokens at the season's end.",
    metrics: { label: "Points Leverage", value: "75.82x" },
    icon: "/points/vsui-item1.svg",
  },
  {
    id: "lp",
    title: "LP-vSUI-250820",
    description:
      "Accrue vSUI APY and trading fees from NEMO pools, while preserving a substantial portion of Volo points. LPs are granted a 2x multiplier on their Nemo points.",
    additionalInfo: "Withdrawals of your funds can be made at any time.",
    metrics: { label: "Total Combined APY", value: "13.36%" },
    icon: "/points/vsui-item2.svg",
  },
  {
    id: "pt",
    title: "PT-vSUI-250820",
    description:
      "Secure a fixed APY on your deposits by swapping your Volo points. Each PT will be redeemable for 1 vSUI upon maturity.",
    additionalInfo:
      "Although the fixed APY is realized at maturity, early exit is possible at the prevailing market price.",
    metrics: { label: "Fixed APY", value: "6.61%" },
    icon: "/points/vsui-item3.svg",
  },
]

const zlpTabs: TabItem[] = [
  {
    id: "yt",
    title: "YT-ZLP-250820",
    description:
      "Boost your points by buying YT at a cost. Along with YTs leverage, you get ZO points multipliers.",
    additionalInfo:
      "YT drops to zero at maturity, but you can exit anytime at its market price, keeping all earned points. These points can be redeemed for airdrop tokens at the season's end.",
    metrics: { label: "Points Leverage", value: "98.11x" },
    icon: "/points/zpl-item1.svg",
  },
  {
    id: "lp",
    title: "LP-ZLP-250820",
    description:
      "Accrue ZLP APY and trading fees from NEMO pools, while preserving a substantial portion of ZO Points. LPs are granted a 2x multiplier on their Nemo points.",
    additionalInfo: "Withdrawals of your funds can be made at any time.",
    metrics: { label: "Total Combined APY", value: "108.11%" },
    icon: "/points/zpl-item2.svg",
  },
  {
    id: "pt",
    title: "PT-ZLP-250820",
    description:
      "Secure a fixed APY on your deposits by swapping your ZO Points. Each PT will be redeemable for 1 ZLP Token upon maturity.",
    additionalInfo:
      "Although the fixed APY is realized at maturity, early exit is possible at the prevailing market price.",
    metrics: { label: "Fixed APY", value: "50.33%" },
    icon: "/points/zpl-item3.svg",
  },
]

const sbusdtTabs: TabItem[] = [
  {
    id: "yt",
    title: "YT-sbUSDT-USDCMMT1-250820",
    description:
      "Boost your points by buying YT at a cost. Along with YTs leverage, you get MMT points multipliers.",
    additionalInfo:
      "YT drops to zero at maturity, but you can exit anytime at its market price, keeping all earned points. These points can be redeemed for airdrop tokens at the season's end.",
    metrics: { label: "Points Leverage", value: "100.32x" },
    icon: "/points/sbusdt-item1.svg",
  },
  {
    id: "lp",
    title: "LP-sbUSDT-USDCMMT1-250820",
    description:
      "Accrue sbUSDT APY and trading fees from NEMO pools, while preserving a substantial portion of MMT Points. LPs are granted a 2x multiplier on their Nemo points.",
    additionalInfo: "Withdrawals of your funds can be made at any time.",
    metrics: { label: "Total Combined APY", value: "37.36%" },
    icon: "/points/sbusdt-item2.svg",
  },
  {
    id: "pt",
    title: "PT-sbUSDT-USDCMMT1-250820",
    description:
      "Secure a fixed APY on your deposits by swapping your MMT Points. Each PT will be redeemable for 1 sbUSDT upon maturity.",
    additionalInfo:
      "Although the fixed APY is realized at maturity, early exit is possible at the prevailing market price.",
    metrics: { label: "Fixed APY", value: "13.33%" },
    icon: "/points/sbusdt-item3.svg",
  },
]

const allTabs = {
  vsui: vsuiTabs,
  zlp: zlpTabs,
  sbusdt: sbusdtTabs,
}

const vsuiProjectData = {
  name: "vSUI",
  date: "2025-08-20",
  rulesLink: "Volo Point Rules",
  description:
    "Determine Your Priority: Amplify Points, Enhance Yields, Or Attain a Balanced Blend.",
  multipliers: {
    volo: "2x",
    nemo: "2x",
  },
  icon: "/points/vsui-big.svg",
}

const zlpProjectData = {
  name: "ZLP",
  date: "2025-08-20",
  rulesLink: "ZO Points Rules",
  description:
    "Determine Your Priority: Amplify Points, Enhance Yields, Or Attain a Balanced Blend.",
  multipliers: {
    volo: "2x",
    nemo: "2x",
  },
  icon: "/points/zpl-big.svg",
}

const sbusdtProjectData = {
  name: "sbUSDT-USDC Vault",
  date: "2025-08-20",
  rulesLink: "MMT Points Rules",
  description:
    "Determine Your Priority: Amplify Points, Enhance Yields, Or Attain a Balanced Blend.",
  multipliers: {
    volo: "2x",
    nemo: "2x",
  },
  icon: "/points/sbusdt-big.svg",
}

const allProjectData = {
  vsui: vsuiProjectData,
  zlp: zlpProjectData,
  sbusdt: sbusdtProjectData,
}

export default function PointsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
      setIsLoading(false)
    }
    resolveParams()
  }, [params])

  if (isLoading) {
    return (
      <div className="bg-[#080d16] text-white min-h-screen p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  // TODO Data is obtained from the interface
  const projectData = allProjectData[id as keyof typeof allProjectData]
  const handleBack = () => {
    router.back()
  }

  return (
    <div className="bg-[#080d16] text-white min-h-screen p-6">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
          style={{
            background: "url(/points/back.svg)",
            width: 75,
            height: 34,
          }}
        ></button>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <Image
              width={48}
              height={48}
              src={projectData.icon}
              alt={projectData.name}
              className="w-12 h-12"
            />
            <div>
              <div className="flex gap-2 mb-1">
                <h1
                  className="text-white text-center"
                  style={{
                    fontFamily: "Season Serif TRIAL",
                    fontSize: "32px",
                    fontWeight: 470,
                    lineHeight: "100%",
                    letterSpacing: "-1.28px",
                    textShadow: "0px 0px 32px rgba(239, 244, 252, 0.56)",
                  }}
                >
                  {projectData.name}
                </h1>
                <div className="flex items-start gap-2">
                  <span
                    className="flex h-6 px-1.5 py-1 justify-center items-center rounded-lg uppercase"
                    style={{
                      background: "rgba(149, 110, 255, 0.10)",
                      color: "rgba(252, 252, 252, 0.40)",
                      fontSize: "12px",
                      fontWeight: 650,
                      lineHeight: "100%",
                      letterSpacing: "0.12px",
                    }}
                  >
                    {projectData.date}
                  </span>
                  <a
                    href="#"
                    className="underline"
                    style={{
                      color: "rgba(252, 252, 252, 0.30)",
                      fontSize: "14px",
                      fontWeight: 550,
                      lineHeight: "120%",
                    }}
                  >
                    {projectData.rulesLink}
                  </a>
                  <Image
                    width={16}
                    height={16}
                    src="/points/share.svg"
                    alt="share"
                    className="w-4 h-4"
                  />
                </div>
              </div>
              <p
                className="max-w-3xl"
                style={{
                  color: "rgba(252, 252, 252, 0.30)",
                  fontSize: "14px",
                  fontWeight: 550,
                  lineHeight: "120%",
                }}
              >
                {projectData.description}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div
              className="text-center w-60"
              style={{ borderLeft: "1px solid rgba(252, 252, 252, 0.08)" }}
            >
              <div
                className="mb-4 uppercase"
                style={{
                  color: "rgba(252, 252, 252, 0.40)",
                  fontSize: "12px",
                  fontWeight: 650,
                  lineHeight: "100%",
                  letterSpacing: "0.12px",
                }}
              >
                VOLO MULTIPLIER
              </div>
              <div
                className="text-center"
                style={{
                  color: "#FCFCFC",
                  fontFamily: "Season Serif TRIAL",
                  fontSize: "56px",
                  fontWeight: 470,
                  lineHeight: "100%",
                  letterSpacing: "-0.56px",
                }}
              >
                {projectData.multipliers.volo}
              </div>
            </div>
            <div
              className="text-center w-60"
              style={{ borderLeft: "1px solid rgba(252, 252, 252, 0.08)" }}
            >
              <div
                className="mb-4 uppercase"
                style={{
                  color: "rgba(252, 252, 252, 0.40)",
                  fontSize: "12px",
                  fontWeight: 650,
                  lineHeight: "100%",
                  letterSpacing: "0.12px",
                }}
              >
                NEMO MULTIPLIER
              </div>
              <div
                className="text-center"
                style={{
                  color: "#FCFCFC",
                  fontFamily: "Season Serif TRIAL",
                  fontSize: "56px",
                  fontWeight: 470,
                  lineHeight: "100%",
                  letterSpacing: "-0.56px",
                }}
              >
                {projectData.multipliers.nemo}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {allTabs[id as keyof typeof allTabs].map((tab) => (
          <div
            key={tab.id}
            className="flex flex-col items-center gap-3 flex-shrink-0 rounded-3xl min-h-[300px] h-full"
            style={{
              padding: "24px",
              background: "rgba(252, 252, 252, 0.03)",
              backdropFilter: "blur(25px)",
            }}
          >
            <div className="relative w-12 h-12 mb-4">
              <Image
                width={60}
                height={60}
                src={tab.icon}
                alt={tab.title}
                className="w-[60px] h-[60px]"
              />
            </div>

            <h3
              className="text-white mb-4"
              style={{
                fontSize: "14px",
                fontWeight: 750,
                lineHeight: "120%",
              }}
            >
              {tab.title}
            </h3>

            <div className="min-h-[180px]">
              <p
                className="mb-4"
                style={{
                  color: "rgba(252, 252, 252, 0.40)",
                  fontSize: "14px",
                  fontWeight: 550,
                  lineHeight: "128%",
                  letterSpacing: "0.14px",
                }}
              >
                {tab.description}
              </p>

              {tab.additionalInfo && (
                <p
                  className="mb-6"
                  style={{
                    color: "rgba(252, 252, 252, 0.40)",
                    fontSize: "14px",
                    fontWeight: 550,
                    lineHeight: "128%",
                    letterSpacing: "0.14px",
                  }}
                >
                  {tab.additionalInfo}
                </p>
              )}
            </div>

            {tab.metrics && (
              <div className="mb-6">
                <div
                  className="mb-2"
                  style={{
                    color: "rgba(252, 252, 252, 0.40)",
                    fontFamily: "Season Sans TRIAL",
                    fontSize: "14px",
                    fontWeight: 550,
                    lineHeight: "128%",
                    letterSpacing: "0.14px",
                  }}
                >
                  {tab.metrics.label}
                </div>
                <div
                  className="text-white"
                  style={{
                    fontSize: "56px",
                    fontWeight: 470,
                    lineHeight: "100%",
                    letterSpacing: "-0.56px",
                  }}
                >
                  {tab.metrics.value}
                </div>
              </div>
            )}
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 transition-colors flex items-center justify-center gap-2"
              style={{
                borderRadius: "999px",
              }}
            >
              <Image
                width={16}
                height={16}
                src="/points/$.svg"
                alt="buy"
                className="w-4 h-4"
              />
              {tab.id === "yt"
                ? "Buy YT"
                : tab.id === "lp"
                ? "Provide Liquidity"
                : "Buy PT"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
