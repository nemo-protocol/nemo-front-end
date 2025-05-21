type Props = {
    current: 'yt' | 'pt' | 'mint';
    onChange: (v: 'yt' | 'pt' | 'mint') => void;
  };
  
  export default function TradeTabs({ current, onChange }: Props) {
    const tabClass = (v: string) =>
      `px-4 py-1 rounded-full text-sm transition ${
        current === v ? 'bg-slate-100 text-slate-900' : 'hover:text-white'
      }`;
  
    return (
      <div className="flex gap-4">
        <button onClick={() => onChange('yt')} className={tabClass('yt')}>
          Yield Token
        </button>
        <button onClick={() => onChange('pt')} className={tabClass('pt')}>
          Principle Token
        </button>
        <button onClick={() => onChange('mint')} className={tabClass('mint')}>
          Mint
        </button>
      </div>
    );
  }
  