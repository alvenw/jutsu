import { useState, useMemo } from "react"
import { FilterSelect, SelectedFilters } from "./jutsu-filters"
import { JutsuTable } from "./jutsu-table"
import { Badge } from "@/components/ui/badge"
import jutsuData from "@/assets/jutsu.json"
import { type Row } from "@tanstack/react-table"

// Add this constant at the top of the file, after imports
const RANK_ORDER: Record<string, number> = {
  'S': 0,
  'A': 1,
  'B': 2,
  'C': 3,
  'D': 4,
  'E': 5,
}

// Define interfaces for our data
interface Jutsu {
  name: string
  classification?: string[]
  nature?: string[]
  rank?: string
  class?: string
  range?: string
}

export default function JutsuDashboard() {
  const [selectedFilters, setSelectedFilters] = useState<{
    category: string
    value: string
  }[]>([])

  // Extract unique values for each filter category
  const filterOptions = useMemo(() => {
    if (!jutsuData) return {
      classification: [],
      nature: [],
      rank: [],
      class: [],
      range: [],
    }

    return {
      classification: Array.from(
        new Set(jutsuData.flatMap((jutsu: Jutsu) => jutsu.classification ?? []))
      ).filter(Boolean).sort(),
      nature: Array.from(
        new Set(jutsuData.flatMap((jutsu: Jutsu) => jutsu.nature ?? []))
      ).filter(Boolean).sort(),
      rank: Array.from(
        new Set(jutsuData.map((jutsu: Jutsu) => jutsu.rank ?? ''))
      ).filter(Boolean).sort(),
      class: Array.from(
        new Set(jutsuData.map((jutsu: Jutsu) => jutsu.class ?? ''))
      ).filter(Boolean).sort(),
      range: Array.from(
        new Set(jutsuData.map((jutsu: Jutsu) => jutsu.range ?? ''))
      ).filter(Boolean).sort(),
    }
  }, [jutsuData])

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      size: 30,
    },
    {
      accessorKey: "classification",
      header: "Classification",
      size: 25,
      cell: ({ row }: { row: Row<Jutsu> }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.classification?.map((c: string) => (
            <Badge key={c} variant="outline">
              {c}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "nature",
      header: "Nature",
      size: 20,
      cell: ({ row }: { row: Row<Jutsu> }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.nature?.map((n: string) => (
            <Badge key={n} variant="outline">
              {n}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "rank",
      header: "Rank",
      size: 5,
      cell: ({ row }: { row: Row<Jutsu> }) => row.original.rank || '-',
      sortingFn: (rowA, rowB, columnId) => {
        const rankA = rowA.getValue(columnId) as string | undefined
        const rankB = rowB.getValue(columnId) as string | undefined
        
        // Handle cases where rank is undefined
        if (!rankA && !rankB) return 0
        if (!rankA) return 1  // Move undefined values to the end
        if (!rankB) return -1
        
        // Use the RANK_ORDER mapping for defined ranks
        return (RANK_ORDER[rankA] ?? 999) - (RANK_ORDER[rankB] ?? 999)
      },
    },
    {
      accessorKey: "class",
      header: "Class",
      size: 10,
      cell: ({ row }: { row: Row<Jutsu> }) => row.original.class || '-',
    },
    {
      accessorKey: "range",
      header: "Range",
      size: 10,
      cell: ({ row }: { row: Row<Jutsu> }) => row.original.range || '-',
    },
  ]

  const filteredData = useMemo(() => {
    if (!jutsuData) return []
    
    return jutsuData.filter((jutsu: Jutsu) => {
      return selectedFilters.every(({ category, value }) => {
        const categoryKey = category.toLowerCase();
        const jutsuValue = jutsu[categoryKey];
        
        if (jutsuValue === undefined || jutsuValue === null) return false;
        
        if (Array.isArray(jutsuValue)) {
          return jutsuValue.some(v => {
            if (typeof v !== 'string') {
              console.error(`Unexpected type for ${categoryKey}:`, v);
              return false;
            }
            return v.toLowerCase() === value.toLowerCase();
          });
        }
        
        if (typeof jutsuValue === 'string') {
          return jutsuValue.toLowerCase() === value.toLowerCase();
        }
        
        console.error(`Unexpected type for ${categoryKey}:`, jutsuValue);
        return false;
      })
    })
  }, [selectedFilters, jutsuData])

  const handleFilterSelect = (category: string, value: string) => {
    const exists = selectedFilters.some(
      (filter) => filter.category === category && filter.value === value
    )

    if (exists) {
      setSelectedFilters(
        selectedFilters.filter(
          (filter) => !(filter.category === category && filter.value === value)
        )
      )
    } else {
      setSelectedFilters([...selectedFilters, { category, value }])
    }
  }

  const handleFilterRemove = (category: string, value: string) => {
    setSelectedFilters(
      selectedFilters.filter(
        (filter) => !(filter.category === category && filter.value === value)
      )
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Jutsu Database</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <FilterSelect
          title="Classification"
          options={filterOptions.classification}
          selected={selectedFilters
            .filter((f) => f.category === "Classification")
            .map((f) => f.value)}
          onSelect={(value) => handleFilterSelect("Classification", value)}
        />
        <FilterSelect
          title="Nature"
          options={filterOptions.nature}
          selected={selectedFilters
            .filter((f) => f.category === "Nature")
            .map((f) => f.value)}
          onSelect={(value) => handleFilterSelect("Nature", value)}
        />
        <FilterSelect
          title="Rank"
          options={filterOptions.rank}
          selected={selectedFilters
            .filter((f) => f.category === "Rank")
            .map((f) => f.value)}
          onSelect={(value) => handleFilterSelect("Rank", value)}
        />
        <FilterSelect
          title="Class"
          options={filterOptions.class}
          selected={selectedFilters
            .filter((f) => f.category === "Class")
            .map((f) => f.value)}
          onSelect={(value) => handleFilterSelect("Class", value)}
        />
        <FilterSelect
          title="Range"
          options={filterOptions.range}
          selected={selectedFilters
            .filter((f) => f.category === "Range")
            .map((f) => f.value)}
          onSelect={(value) => handleFilterSelect("Range", value)}
        />
      </div>

      <SelectedFilters
        selected={selectedFilters}
        onRemove={handleFilterRemove}
      />

      <div className="mt-8">
        <JutsuTable data={filteredData} columns={columns} />
      </div>
    </div>
  )
}

