import { type NormalizedLandmark } from '@mediapipe/hands'

// Types and Interfaces
export interface HandPosition {
  landmarks: NormalizedLandmark[]
  handedness: 'Left' | 'Right'
}

interface DetectionConfidence {
  matches: boolean
  confidence: number
}

interface SealDetectionResult {
  seal: string | null
  confidence: number
}

interface FingerPositions {
  areIndexMiddleTogether: boolean
  areAllFingersTogether: boolean
  areFingersStraight: boolean
  isIndexUp: boolean
  isMiddleUp: boolean
  areFingersCurled: boolean
  thumbOnPinky: boolean
}

interface HandAnalysis {
  isVertical: boolean
  isHorizontal: boolean
  thumbPosition: {
    isUp: boolean
    isOutside: boolean
    isOnTop: boolean
  }
  fingerPositions: FingerPositions
  // Store previous state for occlusion handling
  previousState?: {
    isVertical: boolean
    isHorizontal: boolean
    fingerPositions: FingerPositions
  }
}

interface HandRelationship {
  distance: number
  verticalAlignment: number
  horizontalAlignment: number
  isTriangleFormation: boolean
  areHandsTogether: boolean
  areThumbsTogether: boolean
  areIndexFingersTogether: boolean
  // Add occlusion detection
  possibleOcclusion: boolean
  lastKnownDistance?: number
}

// Helper functions for geometric calculations
const calculateDistance = (point1: NormalizedLandmark, point2: NormalizedLandmark): number => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) +
    Math.pow(point1.y - point2.y, 2)
  )
}

const arePointsClose = (
  point1: NormalizedLandmark,
  point2: NormalizedLandmark,
  threshold = 0.05
): boolean => {
  return calculateDistance(point1, point2) < threshold
}

// Check if a finger is pointing up
const isFingerUp = (base: NormalizedLandmark, tip: NormalizedLandmark): boolean => {
  return tip.y < base.y - 0.1
}

// Check if fingers are curled
const areFingersCurled = (hand: NormalizedLandmark[]): boolean => {
  const indexCurled = hand[8].y > hand[7].y
  const middleCurled = hand[12].y > hand[11].y
  const ringCurled = hand[16].y > hand[15].y
  return indexCurled && middleCurled && ringCurled
}

// Enhanced hand analysis with occlusion handling
const analyzeHandPosition = (
  hand: NormalizedLandmark[],
  previousAnalysis?: HandAnalysis
): HandAnalysis => {
  const wrist = hand[0]
  const thumbTip = hand[4]
  const indexBase = hand[5]
  const indexTip = hand[8]
  const middleTip = hand[12]
  const pinkyTip = hand[20]

  // Check if the landmarks seem valid
  const landmarksValid = [wrist, thumbTip, indexTip, middleTip, pinkyTip].every(
    landmark => landmark && typeof landmark.x === 'number' && typeof landmark.y === 'number'
  )

  // If landmarks are invalid but we have previous state, use it
  if (!landmarksValid && previousAnalysis) {
    return {
      ...previousAnalysis,
      previousState: previousAnalysis
    }
  }

  const analysis: HandAnalysis = {
    isVertical: Math.abs(indexTip.x - pinkyTip.x) < 0.1,
    isHorizontal: Math.abs(indexTip.y - pinkyTip.y) < 0.1,
    thumbPosition: {
      isUp: thumbTip.y < wrist.y - 0.1,
      isOutside: thumbTip.x < indexTip.x,
      isOnTop: thumbTip.y < indexTip.y,
    },
    fingerPositions: {
      areIndexMiddleTogether: arePointsClose(indexTip, middleTip),
      areAllFingersTogether: 
        arePointsClose(indexTip, middleTip) &&
        arePointsClose(middleTip, hand[16]) && // ring finger
        arePointsClose(hand[16], pinkyTip),
      areFingersStraight: 
        isFingerUp(indexBase, indexTip) &&
        isFingerUp(hand[9], middleTip),
      isIndexUp: isFingerUp(indexBase, indexTip),
      isMiddleUp: isFingerUp(hand[9], middleTip),
      areFingersCurled: areFingersCurled(hand),
      thumbOnPinky: arePointsClose(thumbTip, pinkyTip, 0.08) // Slightly larger threshold
    }
  }

  if (previousAnalysis) {
    analysis.previousState = previousAnalysis
  }

  return analysis
}

// Enhanced relationship analysis with occlusion detection
const analyzeHandsRelationship = (
  hands: HandPosition[],
  previousRelationship?: HandRelationship
): HandRelationship => {
  const left = hands.find(h => h.handedness === 'Left')?.landmarks
  const right = hands.find(h => h.handedness === 'Right')?.landmarks
  
  if (!left || !right) throw new Error('Both hands required')

  const leftWrist = left[0]
  const rightWrist = right[0]
  const distance = calculateDistance(leftWrist, rightWrist)

  // Detect possible occlusion
  const possibleOcclusion = previousRelationship ? 
    Math.abs(distance - (previousRelationship.lastKnownDistance || distance)) > 0.2 : false

  const relationship: HandRelationship = {
    distance,
    verticalAlignment: Math.abs(leftWrist.y - rightWrist.y),
    horizontalAlignment: Math.abs(leftWrist.x - rightWrist.x),
    isTriangleFormation: 
      arePointsClose(left[4], right[4]) && // thumbs together
      Math.abs(left[8].y - right[8].y) > 0.1, // index fingers apart vertically
    areHandsTogether: distance < 0.3,
    areThumbsTogether: arePointsClose(left[4], right[4]),
    areIndexFingersTogether: arePointsClose(left[8], right[8]),
    possibleOcclusion,
    lastKnownDistance: distance
  }

  return relationship
}

// Seal-specific detection functions with confidence scoring
const checkBirdSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Triangle formation is crucial for Bird seal
  confidence += relationship.isTriangleFormation ? 0.4 : 0
  
  // Thumbs should be together and on top
  confidence += relationship.areThumbsTogether ? 0.3 : 0
  confidence += (left.thumbPosition.isOnTop && right.thumbPosition.isOnTop) ? 0.2 : 0
  
  // Index fingers should be close
  confidence += relationship.areIndexFingersTogether ? 0.1 : 0

  return {
    matches: confidence > 0.8,
    confidence
  }
}

const checkDragonSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Hands should be together
  confidence += relationship.areHandsTogether ? 0.3 : 0
  
  // Left thumb should be on top
  confidence += left.thumbPosition.isOnTop ? 0.3 : 0
  
  // Fingers should be interlocked
  confidence += relationship.areIndexFingersTogether ? 0.2 : 0
  confidence += (left.fingerPositions.areAllFingersTogether && 
                right.fingerPositions.areAllFingersTogether) ? 0.2 : 0

  return {
    matches: confidence > 0.7,
    confidence
  }
}

const checkTigerSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Both thumbs should be up
  confidence += (left.thumbPosition.isUp && right.thumbPosition.isUp) ? 0.4 : 0
  
  // Fingers should be interlocked
  confidence += relationship.areIndexFingersTogether ? 0.3 : 0
  
  // Hands should be together
  confidence += relationship.areHandsTogether ? 0.3 : 0

  return {
    matches: confidence > 0.8,
    confidence
  }
}

// Decision tree based detection
const detectTriangleFormationSeals = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): SealDetectionResult => {
  // Bird Seal has highest priority in triangle formation
  const birdConfidence = checkBirdSeal(left, right, relationship)
  if (birdConfidence.matches) {
    return { seal: 'Bird', confidence: birdConfidence.confidence }
  }

  // Horse Seal check
  if (relationship.areIndexFingersTogether && 
      left.fingerPositions.areFingersStraight && 
      right.fingerPositions.areFingersStraight) {
    return { seal: 'Horse', confidence: 0.85 }
  }

  return { seal: null, confidence: 0 }
}

// Add new seal-specific detection functions
const checkBoarSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Both hands should be vertical but facing downward
  confidence += (left.isVertical && right.isVertical) ? 0.3 : 0
  
  // Hands should be together
  confidence += relationship.areHandsTogether ? 0.2 : 0
  
  // All fingers should be together in both hands
  confidence += (left.fingerPositions.areAllFingersTogether && 
                right.fingerPositions.areAllFingersTogether) ? 0.3 : 0
  
  // Thumbs should be close together
  confidence += relationship.areThumbsTogether ? 0.2 : 0

  return {
    matches: confidence > 0.8,
    confidence
  }
}

const checkHareSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Left hand should be horizontal (flat on top)
  confidence += left.isHorizontal ? 0.3 : 0
  
  // Right hand should have index and middle finger straight (finger gun)
  confidence += right.fingerPositions.areFingersStraight ? 0.3 : 0
  
  // Hands should be close together
  confidence += relationship.areHandsTogether ? 0.2 : 0
  
  // Left hand should be on top
  confidence += (left.thumbPosition.isOnTop) ? 0.2 : 0

  return {
    matches: confidence > 0.8,
    confidence
  }
}

const checkMonkeySeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Check if thumbs are on pinkies
  confidence += (left.fingerPositions.thumbOnPinky && 
                right.fingerPositions.thumbOnPinky) ? 0.4 : 0
  
  // Hands should be together
  confidence += relationship.areHandsTogether ? 0.3 : 0
  
  // Fingers should be together
  confidence += (left.fingerPositions.areAllFingersTogether && 
                right.fingerPositions.areAllFingersTogether) ? 0.3 : 0

  // If we detect occlusion but had a high confidence before, maintain some confidence
  if (relationship.possibleOcclusion && 
      left.previousState?.fingerPositions.thumbOnPinky && 
      right.previousState?.fingerPositions.thumbOnPinky) {
    confidence = Math.max(confidence, 0.7)
  }

  return {
    matches: confidence > 0.7, // Lower threshold for occluded cases
    confidence
  }
}

const checkRatSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // Right hand should have index and middle fingers straight
  confidence += (right.fingerPositions.isIndexUp && 
                right.fingerPositions.isMiddleUp) ? 0.3 : 0
  
  // Left hand should wrap around (indicated by close proximity)
  confidence += relationship.areHandsTogether ? 0.3 : 0
  
  // Left thumb should be outside
  confidence += left.thumbPosition.isOutside ? 0.2 : 0
  
  // Vertical alignment
  confidence += (left.isVertical && right.isVertical) ? 0.2 : 0

  // Handle occlusion case
  if (relationship.possibleOcclusion && 
      right.previousState?.fingerPositions.isIndexUp && 
      right.previousState?.fingerPositions.isMiddleUp) {
    confidence = Math.max(confidence, 0.7)
  }

  return {
    matches: confidence > 0.7,
    confidence
  }
}

const checkSerpentSeal = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): DetectionConfidence => {
  let confidence = 0

  // All fingers should be interlocked
  confidence += (left.fingerPositions.areAllFingersTogether && 
                right.fingerPositions.areAllFingersTogether) ? 0.4 : 0
  
  // Hands should be very close together
  confidence += relationship.areHandsTogether ? 0.3 : 0
  
  // Vertical alignment
  confidence += (left.isVertical && right.isVertical) ? 0.3 : 0

  // Handle occlusion
  if (relationship.possibleOcclusion && 
      relationship.areHandsTogether && 
      left.previousState?.fingerPositions.areAllFingersTogether && 
      right.previousState?.fingerPositions.areAllFingersTogether) {
    confidence = Math.max(confidence, 0.7)
  }

  return {
    matches: confidence > 0.7,
    confidence
  }
}

// Update the vertical seals detection to include Boar and Serpent
const detectVerticalSeals = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): SealDetectionResult => {
  // Boar Seal (check first as it's most distinctive in vertical alignment)
  const boarConfidence = checkBoarSeal(left, right, relationship)
  if (boarConfidence.matches) {
    return { seal: 'Boar', confidence: boarConfidence.confidence }
  }

  // Serpent Seal
  const serpentConfidence = checkSerpentSeal(left, right, relationship)
  if (serpentConfidence.matches) {
    return { seal: 'Serpent', confidence: serpentConfidence.confidence }
  }

  // Ram Seal
  if (left.thumbPosition.isOnTop && relationship.areHandsTogether) {
    return { seal: 'Ram', confidence: 0.9 }
  }

  // Dragon Seal
  const dragonConfidence = checkDragonSeal(left, right, relationship)
  if (dragonConfidence.matches) {
    return { seal: 'Dragon', confidence: dragonConfidence.confidence }
  }

  // Tiger Seal
  const tigerConfidence = checkTigerSeal(left, right, relationship)
  if (tigerConfidence.matches) {
    return { seal: 'Tiger', confidence: tigerConfidence.confidence }
  }

  return { seal: null, confidence: 0 }
}

// Add new detection branch for special formations
const detectSpecialFormationSeals = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): SealDetectionResult => {
  // Monkey Seal
  const monkeyConfidence = checkMonkeySeal(left, right, relationship)
  if (monkeyConfidence.matches) {
    return { seal: 'Monkey', confidence: monkeyConfidence.confidence }
  }

  // Rat Seal
  const ratConfidence = checkRatSeal(left, right, relationship)
  if (ratConfidence.matches) {
    return { seal: 'Rat', confidence: ratConfidence.confidence }
  }

  // Hare Seal
  const hareConfidence = checkHareSeal(left, right, relationship)
  if (hareConfidence.matches) {
    return { seal: 'Hare', confidence: hareConfidence.confidence }
  }

  return { seal: null, confidence: 0 }
}

// Add back the mixed orientation seals detection
const detectMixedOrientationSeals = (
  left: HandAnalysis,
  right: HandAnalysis,
  relationship: HandRelationship
): SealDetectionResult => {
  // Ox Seal
  if (right.isHorizontal && left.isVertical) {
    return { seal: 'Ox', confidence: 0.9 }
  }

  // Dog Seal
  if (left.isHorizontal && right.fingerPositions.areAllFingersTogether) {
    return { seal: 'Dog', confidence: 0.85 }
  }

  return { seal: null, confidence: 0 }
}

// Update main detection function to handle state persistence
export const detectHandSeal = (hands: HandPosition[]): SealDetectionResult => {
  if (hands.length !== 2) {
    return { seal: null, confidence: 0 }
  }

  try {
    const leftHand = hands.find(h => h.handedness === 'Left')
    const rightHand = hands.find(h => h.handedness === 'Right')

    // Validate that we have both hands and their landmarks
    if (!leftHand?.landmarks || !rightHand?.landmarks) {
      return { seal: null, confidence: 0 }
    }

    // Get previous state from static variable (closure)
    const previousState = detectHandSeal.previousState || {
      leftAnalysis: undefined,
      rightAnalysis: undefined,
      relationship: undefined
    }

    const leftAnalysis = analyzeHandPosition(
      leftHand.landmarks, 
      previousState.leftAnalysis
    )
    const rightAnalysis = analyzeHandPosition(
      rightHand.landmarks,
      previousState.rightAnalysis
    )
    const relationship = analyzeHandsRelationship(
      [leftHand, rightHand],
      previousState.relationship
    )

    // Store current state for next frame
    detectHandSeal.previousState = {
      leftAnalysis,
      rightAnalysis,
      relationship
    }

    let result: SealDetectionResult = { seal: null, confidence: 0 }

    // First Level: Triangle Formation Check
    if (relationship.isTriangleFormation) {
      result = detectTriangleFormationSeals(leftAnalysis, rightAnalysis, relationship)
      if (result.confidence > 0.8) return result
    }

    // Second Level: Special Formation Check
    result = detectSpecialFormationSeals(leftAnalysis, rightAnalysis, relationship)
    if (result.confidence > 0.7) return result // Lower threshold for special formations

    // Third Level: Vertical Alignment Check
    if (leftAnalysis.isVertical && rightAnalysis.isVertical) {
      result = detectVerticalSeals(leftAnalysis, rightAnalysis, relationship)
      if (result.confidence > 0.8) return result
    }

    // Fourth Level: Mixed Orientation Check
    if (leftAnalysis.isVertical !== rightAnalysis.isVertical) {
      result = detectMixedOrientationSeals(leftAnalysis, rightAnalysis, relationship)
      if (result.confidence > 0.8) return result
    }

    return { seal: null, confidence: 0 }
  } catch (error) {
    console.error('Error in hand seal detection:', error)
    return { seal: null, confidence: 0 }
  }
}

// Add static property for state persistence with proper typing
interface DetectionState {
  leftAnalysis?: HandAnalysis
  rightAnalysis?: HandAnalysis
  relationship?: HandRelationship
}

detectHandSeal.previousState = null as DetectionState | null 