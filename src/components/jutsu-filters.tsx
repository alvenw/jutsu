"use client"

import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface FilterProps {
  title: string
  options: string[]
  selected: string[]
  onSelect: (value: string) => void
}

export function FilterSelect({ title, options, selected, onSelect }: FilterProps) {
  const [open, setOpen] = useState(false)

  // Ensure options and selected are always arrays and filter out null/undefined values
  const safeOptions = (options || []).filter(Boolean)
  const safeSelected = (selected || []).filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[200px]"
        >
          {title}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
          <CommandGroup>
            {safeOptions.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => {
                  onSelect(option)
                  setOpen(false)
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    safeSelected.includes(option) ? "opacity-100" : "opacity-0"
                  }`}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SelectedFilters({ selected, onRemove }: { 
  selected: { category: string, value: string }[],
  onRemove: (category: string, value: string) => void 
}) {
  if (selected.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {selected.map(({ category, value }) => (
        <Badge
          key={`${category}-${value}`}
          variant="secondary"
          className="cursor-pointer"
          onClick={() => onRemove(category, value)}
        >
          {value} ×
        </Badge>
      ))}
    </div>
  )
}

