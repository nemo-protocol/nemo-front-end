import Image from 'next/image';
import { TokenMeta } from '@/types/types';

type Props = {
  token: TokenMeta;
};

export default function AssetHeader({ token }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={token.logo}
        alt={token.symbol}
        width={32}
        height={32}
        className="rounded-full"
      />
      <h1 className="text-3xl font-light">{token.symbol}</h1>
      <span className="text-xs bg-slate-700 rounded-full px-1.5">i</span>
    </div>
  );
}
