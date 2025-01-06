import { useState, useEffect, useCallback } from 'react'
import { HandSealDetector } from './hand-seal-detector'
import { JutsuTable } from './jutsu-table'
import jutsuData from '@/assets/jutsu.json'
import { type ColumnDef } from '@tanstack/react-table'

interface Jutsu {
  name: string
  pageid: number
  url: string
  classification?: string[]
  nature?: string[]
  rank: string | null
  class?: string
  range?: string
  hand_seals?: string[]
}

const columns: ColumnDef<Jutsu>[] = [
  {
    accessorKey: "name",
    header: "Jutsu",
    size: 30,
    cell: ({ row }) => (
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
    header: "Required Hand Seals",
    size: 70,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.hand_seals?.map((seal: string, index: number) => (
          <span
            key={`${seal}-${index}`}
            className="px-2 py-1 bg-muted rounded text-sm"
          >
            {seal}
          </span>
        ))}
      </div>
    ),
  },
]

export function HandSealJutsuMatcher() {
  const [detectedSeals, setDetectedSeals] = useState<string[]>([])
  const [matchingJutsus, setMatchingJutsus] = useState<Jutsu[]>([])

  const handleHandSealDetected = useCallback((seals: string[]) => {
    setDetectedSeals(seals)
  }, [])

  useEffect(() => {
    // Filter jutsus that match the detected hand seals sequence
    const matchedJutsus = (jutsuData as Jutsu[]).filter((jutsu) => {
      if (!jutsu.hand_seals || jutsu.hand_seals.length === 0) return false
      
      // For now, we'll match jutsus that contain ALL the detected seals
      // in any order. In a more advanced version, we could match the exact sequence
      return detectedSeals.every(seal => 
        jutsu.hand_seals?.includes(seal)
      )
    })

    setMatchingJutsus(matchedJutsus)
  }, [detectedSeals])

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Hand Seal Detection</h2>
          <p className="text-muted-foreground mb-4">
            Perform hand seals in front of your camera to find matching jutsus. The detected seals will be shown below, 
            and matching jutsus will be displayed in the table.
          </p>
          <HandSealDetector 
            onHandSealDetected={handleHandSealDetected}
            currentSeals={detectedSeals}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Matching Jutsus</h2>
          {matchingJutsus.length > 0 ? (
            <JutsuTable
              data={matchingJutsus}
              columns={columns}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No matching jutsus found. Try performing some hand seals!
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 