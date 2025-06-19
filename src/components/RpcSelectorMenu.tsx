import { RPC_LIST } from '@/app/layout';
import { useEffect, useState } from 'react';

export const STORAGE_KEY = 'RPC_ENDPOINT';



type Latency = Record<string, number | null>;

export default function RpcSelectorMenu() {
    const [lat, setLat] = useState<Latency>({});
    const current = localStorage.getItem(STORAGE_KEY) ?? RPC_LIST[0].url;

    /* ------------------ simple RTT test ------------------ */
    useEffect(() => {
        RPC_LIST.forEach(({ url }) => {
            const controller = new AbortController();
            const t0 = performance.now();
            fetch(url, { method: 'HEAD', signal: controller.signal }).catch(() => null).finally(() => {
                setLat((p) => ({ ...p, [url]: Math.round(performance.now() - t0) }));
            });
            setTimeout(() => controller.abort(), 3000);
        });
    }, []);

    const switchRpc = (url: string) => {
        if (url === current) return;
        localStorage.setItem(STORAGE_KEY, url);
        location.reload();
    };

    return (
        <div className="w-44 space-y-1 text-[14px] font-[500] text-white/60">
            <div className='px-2 py-1.5 text-white'>{"RPC Nods:"}</div>
            {RPC_LIST.map(({ id, name, url }) => {
                const ms = lat[url];
                const latencyColor =
                    ms == null ? 'text-gray-500'
                        : ms > 250 ? 'text-red-400'
                            : ms > 150 ? 'text-yellow-400'
                                : 'text-green-400';

                const active = url === current;

                return (
                    <div className='p-1'  key={id}><button
                        onClick={() => switchRpc(url)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5
                        transition-colors
                        ${active
                                ? 'bg-gray-700 text-white'
                                : 'text-white/60 hover:bg-gray-700/60 hover:text-white'}`}
                    >
                        <span>{name}</span>
                        <span className={`font-mono ${latencyColor}`}>
                            {ms == null ? '…' : `${ms} ms`}
                        </span>
                    </button>
                    </div>
                );
            })}
        </div>
    );
}
