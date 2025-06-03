type SimpleTabProps = {
  tabs: { key: string; label: string }[];
  current: string;
  onChange: (key: string) => void;
};

export default function SimpleTabs({ tabs, current, onChange }: SimpleTabProps) {
  const tabClass = (v: string) =>
    `px-4 py-1 rounded-full text-sm transition ${
      current === v ? 'bg-light-gray/[0.03] text-white' : 'hover:text-light-gray/40'
    }`;

  return (
    <div className="flex gap-4 w-full h-11 text-sm">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={tabClass(tab.key) + " flex-1"}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
} 