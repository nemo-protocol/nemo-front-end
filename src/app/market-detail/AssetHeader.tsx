'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CoinConfig } from '@/queries/types/market';
import { shortenAddress } from '@/lib/utils';

type Props = { coinConfig: CoinConfig };

export default function AssetHeader({ coinConfig }: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  /* 点页面其它地方时关闭 */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-2 relative mt-6">
      <Image
        src={coinConfig.coinLogo}
        alt={coinConfig.coinName}
        width={32}
        height={32}
        className="shrink-0"
      />
      <h1 className="fallback #FCFCFC 
        text-[color:var(--typo-primary,#FCFCFC)]
        [text-shadow:0_0_32px_rgba(239,244,252,0.56)] [font-family:'Season Serif TRIAL'] text-[32px] text-3xl font-light">{coinConfig.coinName}</h1>

      <div className="relative" ref={popRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs rounded-full
                     inline-flex justify-center leading-none
                     w-4 h-8 select-none cursor-pointer"
        >
          <Image
            src={"/tip.svg"}
            alt={""}
            width={16}
            height={16}
            className="shrink-0"
          />
        </button>

        {open && (
          <div
            className="
              absolute top-0 left-0.5 ml-4 w-[480px]  rounded-xl border
              border-[#3F3F3F] bg-[#0E1520] backdrop-blur px-2.5 py-3.5 text-sm
              animate-fade-in z-10
            "
          >
            {/* MARKET INTRO */}
            <Item label="MARKET INTRO" value={coinConfig.marketIntro || '—'} isLong />

            {/* BUILT ON */}
            <Item label="BUILT ON"   link={coinConfig.builtOn?.[0]?.url}>
              <div className="flex items-center gap-2">
                <img
                  src={coinConfig.builtOn?.[0]?.logo}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full"
                />
                <span className="underline">{coinConfig.builtOn?.[0]?.name}</span>
              </div>
            </Item>

            {/* 各种地址 */}
            <Item
              label="ASSET ADDRESS"
              value={shortenAddress(coinConfig.assetAddress)}
              link={coinConfig.marketPositionType}
            />
            <Item
              label="YT ADDRESS"
              value={shortenAddress(coinConfig.ytAddress)}
              link={coinConfig.marketPositionType}
            />
            <Item
              label="PT ADDRESS"
              value={shortenAddress(coinConfig.ptAddress)}
              link={coinConfig.marketPositionType}
            />
            <Item
              label="MARKET ADDRESS"
              value={shortenAddress(coinConfig.marketAddress)}
              link={coinConfig.marketPositionType}
            />

            {/* AUDIT BY */}
            {coinConfig.coinLogo && (
              <>
                <div className="mt-4 h-px w-full " />
                <Item label="AUDIT  BY">
                  <a
                    href={coinConfig.builtOn}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 underline"
                  >
                    <Image
                      src={'/movebit.png'}
                      alt="audit"
                      width={80}
                      height={15}
                      className="object-contain"
                    />
                    Link
                  </a>
                </Item>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 单行条目 ---------- */
function Item({
  label,
  value,
  link,
  isLong,
  children,
}: {
  label: string;
  value?: string;
  link?: string;
  isLong?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex ${isLong ? 'items-start' : 'items-center'} gap-6 mb-4`}>
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
  );
}


