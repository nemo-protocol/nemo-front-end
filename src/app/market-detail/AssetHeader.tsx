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
    <div className="flex items-center gap-3 relative">
      <Image
        src={coinConfig.coinLogo}
        alt={coinConfig.coinName}
        width={32}
        height={32}
        className="rounded-full shrink-0"
      />
      <h1 className="text-3xl font-light">{coinConfig.coinName}</h1>

      {/* info 图标 + 弹窗容器 */}
      <div className="relative" ref={popRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs bg-slate-700 rounded-full px-1.5
                     inline-flex items-center justify-center leading-none
                     w-4 h-4 select-none cursor-pointer"
        >
          i
        </button>

        {open && (
          <div
            className="
              absolute top-0 left-full ml-4 w-[320px] max-w-xs rounded-xl border
              border-slate-600/40 bg-slate-800/90 backdrop-blur p-5 text-sm
              animate-fade-in
            "
          >
            {/* MARKET INTRO */}
            <Item label="MARKET INTRO" value={coinConfig.intro || '—'} isLong />

            {/* BUILT ON */}
            <Item label="BUILT ON">
              <div className="flex items-center gap-2">
                <Image
                  src={coinConfig.coinLogo}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full"
                />
                <span className="underline">{coinConfig.coinName}</span>
              </div>
            </Item>

            {/* 各种地址 */}
            <Item
              label="ASSET ADDRESS"
              value={shortenAddress(coinConfig.marketPositionType)}
              link={coinConfig.marketPositionType}
            />
            <Item
              label="YT ADDRESS"
              value={shortenAddress(coinConfig.marketPositionType)}
              link={coinConfig.marketPositionType}
            />
            <Item
              label="PT ADDRESS"
              value={shortenAddress(coinConfig.marketPositionType)}
              link={coinConfig.marketPositionType}
            />
            <Item
              label="MARKET ADDRESS"
              value={shortenAddress(coinConfig.marketPositionType)}
              link={coinConfig.marketPositionType}
            />

            {/* AUDIT BY */}
            {coinConfig.coinLogo && (
              <>
                <div className="mt-4 h-px w-full bg-slate-600/40" />
                <Item label="AUDIT  BY">
                  <a
                    href={coinConfig.underlyingCoinLogo}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 underline"
                  >
                    <Image
                      src={coinConfig.coinLogo}
                      alt="audit"
                      width={70}
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
      <p className="w-32 shrink-0 text-slate-400 uppercase">{label}</p>
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


