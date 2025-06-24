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
      <VaultsPool />
    </div>
  );
}

