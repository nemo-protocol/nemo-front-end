import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TokenDisplayProps {
  name: string
  logo: string
  className?: string
}

function TokenDisplay({ name, logo, className }: TokenDisplayProps) {
  return (
    <div className={cn("flex items-center gap-x-1", className)} title={name}>
      <span className="max-w-40 truncate text-xl">{name}</span>
      {logo && <Image src={logo} alt={name} width={20} height={20} />}
    </div>
  )
}

interface TokenOption<T> {
  label: string
  logo: string
  value: T
}

interface TokenTypeSelectProps<T> {
  value: T
  options: TokenOption<T>[]
  onChange: (value: T) => void
}

export function TokenTypeSelect<T>({
  value,
  options,
  onChange,
}: TokenTypeSelectProps<T>) {
  const currentOption = options.find((option) => option.value === value)

  return (
    <Select
      value={String(value)}
      onValueChange={(value) => {
        const option = options.find((opt) => String(opt.value) === value)
        if (option) {
          onChange(option.value)
        }
      }}
    >
      <SelectTrigger className="border-none focus:ring-0 p-0 h-auto focus:outline-none bg-transparent text-sm sm:text-base w-fit">
        <SelectValue>
          {currentOption && (
            <TokenDisplay
              name={currentOption.label}
              logo={currentOption.logo}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border border-line-gray outline-none bg-light-gray/[0.03] shadow-[0px_4px_40px_0px_rgba(1,9,20,0.80)] backdrop-blur-[25px]">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              className="cursor-pointer text-white"
            >
              <TokenDisplay name={option.label} logo={option.logo} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
