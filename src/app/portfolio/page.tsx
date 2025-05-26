
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PortfolioPage({ open, onClose }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080d16]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl max-h-[100vh] overflow-y-auto rounded-xl text-slate-100">
        <button className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="px-6 py-6">
          <h1 className="text-2xl font-semibold text-[#FCFCFC]">My Portfolio</h1>
          <div className="mt-4">
            <div className="grid grid-cols-2">
              <div className="flex flex-col items-center">
                <h2 className="text-lg text-[#FCFCFC]">Balance</h2>
                <p className="text-xl">${100200.12.toFixed(2)}</p>
                <p className="text-sm text-green-500">+ $41.58 in 24h</p>
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-lg text-[#FCFCFC]">Total Claimable Yield</h2>
                <p className="text-xl">${400.22.toFixed(2)}</p>
                <p className="text-sm text-green-500">+ $0 in 24h</p>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-xl font-semibold text-[#FCFCFC]">Assets</h2>
          <div className="bg-[#1E1E2F] rounded-xl p-4 mt-2">
            <p className="text-[#FCFCFC]">PT sSUI</p>
            <p className="text-[#FCFCFC66]">Type: Principal Token</p>
            <p className="text-[#FCFCFC66]">Maturity: 2026-02-19</p>
            <p className="text-[#FCFCFC66]">Price: $0.38</p>
            <p className="text-[#FCFCFC]">Amount: 45.3333</p>
          </div>

          <h2 className="mt-6 text-xl font-semibold text-[#FCFCFC]">Latest Transactions</h2>
          <div className="mt-4">
            {[{date: '2025-03-09', asset: 'YT sSUI', type: 'Buy'}, {date: '2025-03-09', asset: 'YT sSUI', type: 'Sell'}, {date: '2025-03-09', asset: 'LP sSUI', type: 'Add'}].map((transaction, index) => (
              <div key={index} className="bg-[#1E1E2F] rounded-xl p-3 mb-2 flex justify-between items-center">
                <div>
                  <p className="text-[#FCFCFC]">{transaction.date}</p>
                  <p className="text-[#FCFCFC66]">{transaction.asset}: {transaction.type}</p>
                </div>
                <div className="text-[#FCFCFC]">Amount: xxxxx</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}