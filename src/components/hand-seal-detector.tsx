import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { HAND_CONNECTIONS } from '@mediapipe/hands'
import { Button } from './ui/button'
import { detectHandSeal, type HandPosition } from '@/utils/hand-seal-detection'

interface HandSealDetectorProps {
  onHandSealDetected: (handSeals: string[]) => void
  currentSeals: string[]
}

export function HandSealDetector({ onHandSealDetected, currentSeals }: HandSealDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStarted, setIsStarted] = useState(false)
  const cameraRef = useRef<Camera | null>(null)
  const handsRef = useRef<Hands | null>(null)
  const lastDetectedSealRef = useRef<string | null>(null)
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [debugMode, setDebugMode] = useState(false)

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return

    // Initialize hands only if not already initialized
    if (!handsRef.current) {
      handsRef.current = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })

      handsRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      handsRef.current.onResults((results) => {
        if (!canvasRef.current) return

        const canvasCtx = canvasRef.current.getContext('2d')
        if (!canvasCtx) return

        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        canvasCtx.drawImage(
          results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)

        if (results.multiHandLandmarks && results.multiHandedness) {
          // Draw hand landmarks
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
              { color: '#00FF00', lineWidth: 5 })
            drawLandmarks(canvasCtx, landmarks,
              { color: '#FF0000', lineWidth: 2 })
          }

          if (debugMode) {
            console.log('Number of hands detected:', results.multiHandLandmarks.length)
            console.log('Hand types:', results.multiHandedness.map(h => h.label))
          }

          // Only proceed if we detect exactly 2 hands
          if (results.multiHandLandmarks.length === 2) {
            // Prepare hand positions for seal detection
            const handPositions: HandPosition[] = results.multiHandLandmarks.map((landmarks, index) => ({
              landmarks,
              handedness: results.multiHandedness[index].label as 'Left' | 'Right'
            }))

            // Detect hand seals
            const detectedSeal = detectHandSeal(handPositions)
            
            if (debugMode) {
              console.log('Attempting seal detection...')
              if (detectedSeal) {
                console.log('✅ Detected seal:', detectedSeal)
              }
            }
            
            // Only add new seal if it's different from the last one and persists for a short time
            if (detectedSeal && detectedSeal !== lastDetectedSealRef.current) {
              if (detectionTimeoutRef.current) {
                clearTimeout(detectionTimeoutRef.current)
              }
              
              detectionTimeoutRef.current = setTimeout(() => {
                console.log('🎯 Confirmed seal detection:', detectedSeal)
                onHandSealDetected([...currentSeals, detectedSeal])
                lastDetectedSealRef.current = detectedSeal
              }, 1000) // Wait 1 second to confirm the seal
            }
          } else if (debugMode) {
            console.log('❌ Need exactly 2 hands for seal detection')
          }
        }

        canvasCtx.restore()
      })
    }

    // Start/stop camera based on isStarted state
    if (isStarted && !cameraRef.current && handsRef.current) {
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480
      })
      cameraRef.current.start()
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [isStarted, debugMode, onHandSealDetected, currentSeals])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handsRef.current) {
        handsRef.current.close()
        handsRef.current = null
      }
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [])

  const handleStartStop = useCallback(() => {
    if (isStarted) {
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
      onHandSealDetected([])
      lastDetectedSealRef.current = null
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
    setIsStarted(!isStarted)
  }, [isStarted, onHandSealDetected])

  const handleClearSeals = useCallback(() => {
    onHandSealDetected([])
    lastDetectedSealRef.current = null
  }, [onHandSealDetected])

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={640}
          height={480}
        />
        
        {!isStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-lg font-medium">Click "Start Camera" to begin hand seal detection</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="space-x-2">
          <Button
            onClick={handleStartStop}
            variant={isStarted ? "destructive" : "default"}
          >
            {isStarted ? "Stop Camera" : "Start Camera"}
          </Button>
          
          {currentSeals.length > 0 && (
            <Button
              onClick={handleClearSeals}
              variant="outline"
            >
              Clear Seals
            </Button>
          )}

          <Button
            onClick={() => setDebugMode(prev => !prev)}
            variant="outline"
            size="sm"
          >
            {debugMode ? "Disable Debug" : "Enable Debug"}
          </Button>
        </div>
        
        {currentSeals.length > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Detected Seals:</span>
            <div className="flex gap-2">
              {currentSeals.map((seal, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm"
                >
                  {seal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 