"use client"

import Image from "next/image"
import { CoinConfig } from "@/queries/types/market"
import { shortenAddress } from "@/lib/utils"
import InfoTooltip from "@/components/InfoTooltip"

type Props = { coinConfig: CoinConfig }

export default function AssetHeader({ coinConfig }: Props) {
  return (
    <div className="flex items-center gap-2 relative mt-2">
      <Image
        src={coinConfig.coinLogo}
        alt={coinConfig.coinName}
        width={32}
        height={32}
        className="shrink-0"
      />
      <InfoTooltip
        side="right"
        content={
          <div className="relative">
            <div
              className="
                  w-[480px] rounded-xl 
                  border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm
                  z-10
                "
            >
              {/* MARKET INTRO */}
              <Item
                label="MARKET INTRO"
                value={coinConfig.marketIntro || "—"}
                isLong
              />

              {/* BUILT ON */}
              <Item label="BUILT ON">
                <div className="flex flex-col gap-2">
                  {coinConfig.builtOn?.map((item, index) => (
                    <a
                      key={index}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2"
                    >
                      <img
                        width={18}
                        height={18}
                        src={item.logo}
                        alt={item.name}
                        title={item.name}
                      />
                      <span className="underline">{item.name}</span>
                    </a>
                  ))}
                </div>
              </Item>

              {/* 各种地址 */}
              <Item
                label="ASSET ADDRESS"
                value={shortenAddress(coinConfig.assetAddress)}
                link={`https://suivision.xyz/nft/collection/${coinConfig.assetAddress}`}
              />
              <Item
                label="YT ADDRESS"
                value={shortenAddress(coinConfig.ytAddress)}
                link={`https://suivision.xyz/nft/collection/${coinConfig.ytAddress}`}
              />
              <Item
                label="PT ADDRESS"
                value={shortenAddress(coinConfig.ptAddress)}
                link={`https://suivision.xyz/nft/collection/${coinConfig.ptAddress}`}
              />
              <Item
                label="MARKET ADDRESS"
                value={shortenAddress(coinConfig.marketAddress)}
                link={`https://suivision.xyz/nft/collection/${coinConfig.marketAddress}`}
              />

              {/* AUDIT BY */}
              {coinConfig.coinLogo && (
                <Item label="AUDIT  BY">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 underline"
                    href={
                      "https://movebit.xyz/reports/20250217-Nemo-Final-Audit-Report.pdf"
                    }
                  >
                    <Image
                      alt="audit"
                      width={80}
                      height={15}
                      title="Movebit"
                      src={"/movebit.png"}
                    />
                  </a>
                </Item>
              )}
            </div>
          </div>
        }
      >
        <h1
          className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        font-normal font-serif text-[32px]"
        >
          {coinConfig.coinName}
        </h1>
      </InfoTooltip>
    </div>
  )
}

/* ---------- 单行条目 ---------- */
function Item({
  label,
  value,
  link,
  isLong,
  children,
}: {
  label: string
  value?: string
  link?: string
  isLong?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={`flex ${isLong ? "items-start" : "items-center"} gap-6 mb-4`}
    >
      <p className="w-32 shrink-0 text-[#6D7177] uppercase">{label}</p>
      {children ? (
        children
      ) : link ? (
        <a href={link} target="_blank" rel="noreferrer" className="underline">
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  )
}
