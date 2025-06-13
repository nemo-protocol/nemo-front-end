type SimpleTabProps = {
  tabs: { key: string; label: string; disabled?: boolean }[]
  current: string
  onChange: (key: string) => void
}

export default function SimpleTabs({
  tabs,
  current,
  onChange,
}: SimpleTabProps) {
  const tabClass = (v: string, disabled?: boolean) =>
    `px-4 py-1 rounded-full text-sm transition flex-1 ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : current === v
        ? "bg-light-gray/[0.03] text-white"
        : "hover:text-white text-light-gray/40"
    }`

  return (
    <div className="flex gap-4 w-full h-11 text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          disabled={tab.disabled}
          className={tabClass(tab.key, tab.disabled)}
          onClick={() => !tab.disabled && onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
