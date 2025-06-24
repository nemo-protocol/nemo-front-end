// components/VaultCards.tsx
'use client';

import Image from 'next/image';

interface Vault {
  badges: string[];
  tokens: string[];     // icon 路径
  name: string;         // suiUSDT-USDC …
  type: string;         // LP Vault / ……
  apy: string;          // 32.37% …
  protocol: string;     // Momentum
  tvl: string;          // $3.20M
}

/**
 * 写在实际开发中可放到后端或 SWR 请求返回
 */
const vaults: Vault[] = [
  {
    badges: ['Sui Incentives', 'MMT Bricks', 'Nemo Points'],
    tokens: ['/assets/icons/usdt.svg', '/assets/icons/usdc.svg'],
    name: 'suiUSDT-USDC',
    type: 'LP Vault',
    apy: '32.37%',
    protocol: 'Momentum',
    tvl: '$3.20M',
  },
  {
    badges: ['Sui Incentives', 'MMT Bricks', 'Nemo Points'],
    tokens: ['/assets/icons/usdt.svg', '/assets/icons/usdc.svg'],
    name: 'suiUSDT-USDC',
    type: 'LP Vault',
    apy: '32.37%',
    protocol: 'Momentum',
    tvl: '$3.20M',
  },
  {
    badges: ['MMT Bricks', 'Nemo Points'],
    tokens: ['/assets/icons/sui.svg', '/assets/icons/hasui.svg'],
    name: 'SUI-haSUI',
    type: 'LP Vault',
    apy: '16.37%',
    protocol: 'Momentum',
    tvl: '$123,333.99',
  },
];

export default function VaultCards() {
  return (
    <div className='flex items-center justify-between gap-6 px-7.5 mt-12 mb-12'>
      {vaults.map((v, idx) => (
        <div
          key={idx}
          className='relative h-[287px] w-[413px] overflow-hidden rounded-xl bg-[#13181B]'
        >
          {/* 顶部渐变背景图 */}
          <Image
            src='/assets/images/vaults/card-bg.png'
            alt=''
            width={413}
            height={130}
            className='absolute inset-0 h-[130px] w-full object-cover'
          />

          {/* 徽章区域 */}
          <div className='relative z-10 flex flex-wrap gap-1 px-5 pt-4'>
            {v.badges.map((b, i) => (
              <span
                key={i}
                className='flex items-center gap-1 rounded-full bg-[#1E262A] px-2 py-0.5 text-xs font-medium text-[#C8D1D3]'
              >
                {b}
              </span>
            ))}
          </div>

          {/* 核心信息 */}
          <div className='relative z-10 mt-10 flex items-center px-5'>
            {/* token icons */}
            <div className='flex -space-x-3'>
              {v.tokens.map((t, i) => (
                <Image
                  key={i}
                  src={t}
                  alt=''
                  width={32}
                  height={32}
                  className='rounded-full border border-[#13181B]'
                />
              ))}
            </div>

            <div className='ml-3'>
              <p className='text-lg font-semibold text-white'>{v.name}</p>
              <p className='text-xs text-[#8A9499]'>{v.type}</p>
            </div>

            {/* APY */}
            <div className='ml-auto text-right'>
              <p className='text-3xl font-bold text-white'>{v.apy}</p>
              <p className='text-xs text-[#8A9499]'>APY</p>
            </div>
          </div>

          {/* 底部信息与按钮 */}
          <div className='absolute bottom-0 w-full px-5 pb-5'>
            <div className='mb-3 flex justify-between text-xs text-[#8A9499]'>
              <span>Source Protocol</span>
              <span className='font-medium text-white'>{v.protocol}</span>
            </div>

            <div className='mb-4 flex justify-between text-xs text-[#8A9499]'>
              <span>TVL</span>
              <span className='font-medium text-white'>{v.tvl}</span>
            </div>

            <button className='h-9 w-full rounded-md bg-gradient-to-r from-[#266EFF] to-[#11C7FF] text-sm font-semibold text-white transition-opacity hover:opacity-90'>
              Deposit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}