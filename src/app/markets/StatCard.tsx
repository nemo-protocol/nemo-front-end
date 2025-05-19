import { MarketStat } from '@/types/types';

export default function StatCard({ stat }: { stat: MarketStat }) {
  return (
    <div className="bg-[#101823] rounded-xl p-5 w-full">
      <p className="text-xs tracking-widest text-slate-400 uppercase mb-1">
        {stat.label}
      </p>
      <p className="text-xl font-medium mb-1">{stat.value}</p>

      {!!stat.delta && (
        <span
          className={`text-xs py-0.5 px-1.5 rounded-full 
          ${stat.deltaPositive ? 'bg-green-900 text-green-400'
                               : 'bg-red-900 text-red-400'}`}
        >
          {stat.deltaPositive ? '+' : ''}
          {stat.delta}
        </span>
      )}
    </div>
  );
}
