import { useState, useMemo } from "react"
import { FilterSelect, SelectedFilters } from "./jutsu-filters"
import { JutsuTable } from "./jutsu-table"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { HandSealJutsuMatcher } from "./hand-seal-jutsu-matcher"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  pageid: number
  url: string
  classification?: string[]
  nature?: string[]
  rank?: string | null
  class?: string | null
  range?: string | null
  hand_seals?: string[]
  [key: string]: string | number | string[] | null | undefined // Add index signature
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
      hand_seals: [],
    }

    return {
      classification: Array.from(
        new Set(jutsuData.flatMap((jutsu) => jutsu.classification ?? []))
      ).filter(Boolean).sort(),
      nature: Array.from(
        new Set(jutsuData.flatMap((jutsu) => jutsu.nature ?? []))
      ).filter(Boolean).sort(),
      rank: Array.from(
        new Set(jutsuData.map((jutsu) => jutsu.rank ?? ''))
      ).filter(Boolean).sort(),
      class: Array.from(
        new Set(jutsuData.map((jutsu) => jutsu.class ?? ''))
      ).filter(Boolean).sort(),
      range: Array.from(
        new Set(jutsuData.map((jutsu) => jutsu.range ?? ''))
      ).filter(Boolean).sort(),
      hand_seals: Array.from(
        new Set(jutsuData.flatMap((jutsu) => jutsu.hand_seals ?? []))
      ).filter(Boolean).sort(),
    }
  }, [jutsuData])

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      size: 20,
      cell: ({ row }: { row: Row<Jutsu> }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          tabIndex={0}
          aria-label={`View ${row.original.name} on Naruto Wiki`}
        >
          {row.original.name}
        </a>
      ),
    },
    {
      accessorKey: "hand_seals",
      header: "Hand Seals",
      size: 20,
      cell: ({ row }: { row: Row<Jutsu> }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.hand_seals?.map((seal: string, index: number) => (
            <Badge key={`${seal}-${index}`} variant="outline">
              {seal}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "classification",
      header: "Classification",
      size: 20,
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
      size: 10,
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
      sortingFn: (rowA: Row<Jutsu>, rowB: Row<Jutsu>, columnId: string) => {
        const rankA = rowA.getValue(columnId) as string | null
        const rankB = rowB.getValue(columnId) as string | null

        // Convert ranks to their numeric values for comparison
        const valueA = rankA ? RANK_ORDER[rankA.replace('-rank', '')] : undefined
        const valueB = rankB ? RANK_ORDER[rankB.replace('-rank', '')] : undefined

        // Handle null/undefined cases
        if (valueA === undefined && valueB === undefined) return 0
        if (valueA === undefined) return 1
        if (valueB === undefined) return -1

        // Compare numeric values
        return valueA - valueB
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
      size: 15,
      cell: ({ row }: { row: Row<Jutsu> }) => row.original.range || '-',
    },
  ]

  const filteredData = useMemo(() => {
    if (!jutsuData) return []
    
    return jutsuData.filter((jutsu) => {
      return selectedFilters.every(({ category, value }) => {
        const categoryKey = category.toLowerCase() as keyof Jutsu;
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
    }) as Jutsu[]
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Jutsu Database</h1>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="hand-seals" className="space-y-8">
        <TabsList>
          <TabsTrigger value="hand-seals">Hand Seal Detection</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-8">
          <div className="flex flex-wrap gap-4">
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
            <FilterSelect
              title="Hand Seals"
              options={filterOptions.hand_seals}
              selected={selectedFilters
                .filter((f) => f.category === "Hand Seals")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Hand Seals", value)}
            />
          </div>

          <SelectedFilters
            selected={selectedFilters}
            onRemove={handleFilterRemove}
          />

          <div className="mt-8">
            <JutsuTable data={filteredData} columns={columns} />
          </div>
        </TabsContent>

        <TabsContent value="hand-seals">
          <HandSealJutsuMatcher />
        </TabsContent>
      </Tabs>
    </div>
  )
}

