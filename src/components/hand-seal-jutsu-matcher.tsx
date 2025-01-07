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
    <div className="relative h-screen flex flex-col">
      {/* Camera view takes up most of the space but leaves room for matching jutsus */}
      <div className="relative h-[calc(100vh-200px)] min-h-0">
        <HandSealDetector 
          onHandSealDetected={handleHandSealDetected}
          currentSeals={detectedSeals}
        />
      </div>
      
      {/* Matching Jutsus Panel - Fixed height at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm h-[400px] overflow-y-auto">
        <div className="container mx-auto py-4 px-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Matching Jutsus</h2>
            {matchingJutsus.length > 0 ? (
              <div className="space-y-2">
                {matchingJutsus.map((jutsu) => (
                  <div 
                    key={jutsu.pageid}
                    className="flex items-center justify-between bg-white/10 rounded-lg p-3 text-white"
                  >
                    <div>
                      <a
                        href={jutsu.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-primary transition-colors"
                      >
                        {jutsu.name}
                      </a>
                      <div className="flex gap-2 mt-2">
                        {jutsu.hand_seals?.map((seal, index) => (
                          <span
                            key={`${seal}-${index}`}
                            className="px-2 py-1 bg-white/10 rounded text-sm"
                          >
                            {seal}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-white/70">
                No matching jutsus found. Try performing some hand seals!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 