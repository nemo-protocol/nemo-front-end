'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import copy from "clipboard-copy"

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useMyRank } from '@/hooks/useMyRank';
import EmptyData from '@/components/ui/empty';
import { useToast } from '@/components/Toast';
import VaultsPool from './components/VaultsPool';
import Link from 'next/link';
import VaultCards from './components/VaultCards';

export default function VaultsPage() {

  return (
    <div className="py-4 bg-[#080d16]">
      <h1 className="text-[32px] w-full flex justify-center gap-2 items-start font-normal font-serif font-[470] text-[#FCFCFC]">Vaults
        <Image
          src={"/assets/images/vaults/vaults-title.svg"}
          alt={""}
          width={16}
          height={16}
          className="shrink-0 mt-1.5"
        /></h1>
      <div className='text-[rgba(252,252,252,0.40)] font-[500] text-[14px] flex gap-4 justify-center w-full mt-3'>
        Improve your financial strategy by automating for optimized yield results.
        <Link
          href=""
          className='text-[rgba(255,136,0,0.5)] flex items-center gap-1 cursor-pointer hover:text-[rgba(255,136,0,1)] transition'>
          <Image
            src={"/assets/images/vaults/circle-orange.svg"}
            alt={""}
            width={16}
            height={16}
            className="shrink-0 "
          />How it works?</Link>
      </div>
      <VaultCards />
      <VaultsPool vaults={[{
        apy: "0.123",
        coinType: "0x123::vault::VAULT",
        deploymentUnix: "Vault is xxxxxxxxx",
        fee: "string",
        cardShowTagList: [
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
        sourceProtocolLogoUrl: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        sourceProtocolUrl: "string",
        tvl: "12345.67",
        vaultAddress: "0x12345678",
        vaultName: "suiUSDT-USDC",
        vaultOverview: "Vault is xxxxxxxxx",
        earnings: '12.34'
      },
      {
        apy: "0.123",
        coinType: "0x123::vault::VAULT",
        deploymentUnix: "Vault is xxxxxxxxx",
        fee: "string",
        cardShowTagList: [
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
        sourceProtocolLogoUrl: "https://app.nemoprotocol.com/static/pureUsdc.svg",
        sourceProtocolUrl: "string",
        tvl: "12345.67",
        vaultAddress: "0x12345678",
        vaultName: "suiUSDT-USDC",
        vaultOverview: "Vault is xxxxxxxxx",
        earnings: '12.34'
      }]} />
    </div>
  );
}

