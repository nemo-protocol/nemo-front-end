// components/VaultCards.tsx
'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { useVaultInfo } from '@/hooks/useVaultInfo';
import { useRouter } from 'next/navigation';

/* -------------------- 工具函数 -------------------- */

/** 0.123 -> 12.30% */
const formatApy = (raw: string) =>
    `${(Number(raw) * 100).toFixed(2)}%`;

/** 12345.67 -> $12.35K / 3254321 -> $3.25M */
function formatTvl(raw: string) {
    const n = Number(raw);
    if (Number.isNaN(n)) return raw;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return `${n.toFixed(2)}`;
}


/* -------------------- 组件 -------------------- */

export default function VaultCards() {

    const {
        data,
        loading,
        error,
    } = useVaultInfo({ pageSize: 20, pageIndex: 1 });

    /* --------------------- 状态处理 ------------------- */
    if (loading) {
        return (
            <div className="mt-12 mb-12 flex justify-center">
                <p className="text-[#8A9499]">Loading vaults…</p>
            </div>
        );
    }


    const vaults =  [{
        apy: "0.123",
        coinType: "0x123::vault::VAULT",
        deploymentUnix: "Vault is xxxxxxxxx",
        fee: "string",
        cardShowTagList:[
            'Sui Incentives',
            'MMT Bricks'
        ],
        leftCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        leftCoinName: "sui",
        leftCoinPrice: "1.6789",
        leftCoinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        leftTokenAmount: "12345.6789",
        maturity: "string",
        rightCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        rightCoinName: "wal",
        rightCoinPrice: "1.6789",
        rightCoinType: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
        rightTokenAmount: "12345.6789",
        sourceProtocol: "Momentum",
        sourceProtocolLogoUrl: "https://oss.nemoprotocol.com/xxx.svg",
        sourceProtocolUrl: "string",
        tvl: "12345.67",
        vaultAddress: "0x12345678",
        vaultName: "suiUSDT-USDC",
        vaultOverview: "Vault is xxxxxxxxx"
    },
    {
        apy: "0.123",
        coinType: "0x123::vault::VAULT",
        deploymentUnix: "Vault is xxxxxxxxx",
        fee: "string",
        cardShowTagList:[
            'Sui Incentives',
            'MMT Bricks'
        ],
        leftCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        leftCoinName: "sui",
        leftCoinPrice: "1.6789",
        leftCoinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        leftTokenAmount: "12345.6789",
        maturity: "string",
        rightCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        rightCoinName: "wal",
        rightCoinPrice: "1.6789",
        rightCoinType: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
        rightTokenAmount: "12345.6789",
        sourceProtocol: "Momentum",
        sourceProtocolUrl: "string",
        tvl: "12345.67",
        vaultAddress: "0x12345678",
        vaultName: "suiUSDT-USDC",
        vaultOverview: "Vault is xxxxxxxxx"
    },{
        apy: "0.123",
        coinType: "0x123::vault::VAULT",
        deploymentUnix: "Vault is xxxxxxxxx",
        fee: "string",
        cardShowTagList:[
            'Sui Incentives',
            'MMT Bricks'
        ],
        leftCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        leftCoinName: "sui",
        leftCoinPrice: "1.6789",
        leftCoinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        leftTokenAmount: "12345.6789",
        maturity: "string",
        rightCoinLogo: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        rightCoinName: "wal",
        rightCoinPrice: "1.6789",
        rightCoinType: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
        rightTokenAmount: "12345.6789",
        sourceProtocol: "Momentum",
        sourceProtocolUrl: "string",
        tvl: "12345.67",
        vaultAddress: "0x12345678",
        vaultName: "suiUSDT-USDC",
        vaultOverview: "Vault is xxxxxxxxx"
    }];
    const router = useRouter()


    /* --------------------- 渲染卡片 -------------------- */
    return (
        <div className="mt-12 mb-12 flex items-center justify-between gap-6 px-7.5">
            {vaults.map((v) => (
                <div
                    key={`${v.vaultAddress}-${v.maturity}`}
                    className="relative h-[287px] w-[413px] overflow-hidden rounded-xl bg-[#13181B]"
                >

                    <Image
                        src="/assets/images/vaults/card-bg.png"
                        alt=""
                        width={413}
                        height={130}
                        className="absolute inset-0 h-[130px] w-full object-cover"
                    />


                    <div className="relative z-10 flex flex-wrap gap-1 px-5 pt-4">
                        {v.cardShowTagList.map((b) => (
                            <span
                                key={b}
                                className="flex items-center gap-1 rounded-full bg-[#1E262A] px-2 py-0.5 text-xs font-medium text-[#C8D1D3]"
                            >
                                {b}
                            </span>
                        ))}
                    </div>


                    <div className="relative z-10 mt-10 flex items-center px-5">

                        <div className="-space-x-3 flex">
                            {[v.leftCoinLogo, v.rightCoinLogo].map((src, i) => (
                                <img
                                    key={i}
                                    src={src}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className={clsx(
                                        'rounded-full border border-[#13181B]',
                                        i === 0 && 'relative z-20'
                                    )}
                                />
                            ))}
                        </div>

                        <div className="ml-3">
                            <p className="text-lg font-semibold text-white">{v.vaultName}</p>
                            <p className="text-xs text-[#8A9499]">LP Vault</p>
                        </div>

                        {/* APY */}
                        <div className="ml-auto text-right">
                            <p className="text-3xl font-bold text-white">
                                {formatApy(v.apy)}
                            </p>
                            <p className="text-xs text-[#8A9499]">APY</p>
                        </div>
                    </div>

                    {/* 底部信息与按钮 */}
                    <div className="absolute bottom-0 w-full px-5 pb-5">
                        <div className="mb-3 flex justify-between text-xs text-[#8A9499]">
                            <span>Source Protocol</span>
                            <span className="font-medium text-white">
                                {v.sourceProtocol}
                            </span>
                        </div>

                        <div className="mb-4 flex justify-between text-xs text-[#8A9499]">
                            <span>TVL</span>
                            <span className="font-medium text-white">
                                {formatTvl(v.tvl)}
                            </span>
                        </div>

                        <button
                            className="h-9 w-full rounded-md bg-gradient-to-r from-[#266EFF] to-[#11C7FF] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            onClick={() =>
                               { router.push("/vaults/detail")}

                            }
                        >
                            Deposit
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}