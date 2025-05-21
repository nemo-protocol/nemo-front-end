// components/layout/Footer.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#080E16]">
      {/* 横向分隔线（可不要） */}
      <div className="h-px w-full bg-slate-600/20 mb-6" />

      {/* 主体 */}
      <div className="flex items-center justify-between px-6 pb-10">
        <a
          href="https://sui.io"
          target="_blank"
          rel="noreferrer"
       
          className="inline-flex items-center gap-2 text-sm 
                     rounded-full px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 text-white/60"
        >
          Powered&nbsp;by
          <Image
            src="/sui.svg"    
            alt="Sui"
            width={36}
            height={36}
            className="object-contain"
          />
        </a>

        {/* 右侧链接组 */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/terms"
            className="text-slate-400 hover:text-white transition"
          >
            Terms&nbsp;&amp;&nbsp;Agreements
          </Link>
          {/* 如还有隐私政策等可继续加 */}
        </div>
      </div>
    </footer>
  );
}
