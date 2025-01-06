import { type NormalizedLandmark } from '@mediapipe/hands'

// MediaPipe hand landmarks indices
const THUMB_TIP = 4
const INDEX_TIP = 8
const MIDDLE_TIP = 12
const RING_TIP = 16
const PINKY_TIP = 20
const WRIST = 0

export interface HandPosition {
  landmarks: NormalizedLandmark[]
  handedness: 'Left' | 'Right'
}

// Helper functions to analyze hand positions
const areFingersTogether = (
  landmarks1: NormalizedLandmark[],
  finger1: number,
  landmarks2: NormalizedLandmark[],
  finger2: number,
  threshold = 0.05
) => {
  const distance = Math.sqrt(
    Math.pow(landmarks1[finger1].x - landmarks2[finger2].x, 2) +
    Math.pow(landmarks1[finger1].y - landmarks2[finger2].y, 2)
  )
  return distance < threshold
}

const areFingersTogetherSameHand = (
  landmarks: NormalizedLandmark[],
  finger1: number,
  finger2: number,
  threshold = 0.05
) => {
  const distance = Math.sqrt(
    Math.pow(landmarks[finger1].x - landmarks[finger2].x, 2) +
    Math.pow(landmarks[finger1].y - landmarks[finger2].y, 2)
  )
  return distance < threshold
}

const isFingerStraight = (
  landmarks: NormalizedLandmark[],
  fingerTip: number,
  threshold = 0.1
) => {
  const fingerBase = fingerTip - 3
  return landmarks[fingerTip].y < landmarks[fingerBase].y - threshold
}

const areThumbsUp = (landmarks: NormalizedLandmark[]) => {
  return landmarks[THUMB_TIP].y < landmarks[WRIST].y - 0.1
}

// Seal detection functions
export const detectMonkeySeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Monkey seal: thumbs lie flat on pinkies
  const isLeftCorrect = areFingersTogetherSameHand(leftHand, THUMB_TIP, PINKY_TIP)
  const isRightCorrect = areFingersTogetherSameHand(rightHand, THUMB_TIP, PINKY_TIP)

  return isLeftCorrect && isRightCorrect
}

export const detectDragonSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Dragon seal: left thumb on top, fingers interlocked
  const isLeftThumbOnTop = leftHand[THUMB_TIP].y < rightHand[THUMB_TIP].y
  const areFingersInterlocked = 
    areFingersTogether(leftHand, INDEX_TIP, rightHand, INDEX_TIP) &&
    areFingersTogether(leftHand, MIDDLE_TIP, rightHand, MIDDLE_TIP)

  return isLeftThumbOnTop && areFingersInterlocked
}

export const detectRatSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Rat seal: left thumb on the outside
  const isLeftThumbOutside = leftHand[THUMB_TIP].x < leftHand[INDEX_TIP].x
  const areFingersInterlocked = 
    areFingersTogether(leftHand, INDEX_TIP, rightHand, INDEX_TIP)

  return isLeftThumbOutside && areFingersInterlocked
}

export const detectBirdSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Bird seal: thumbs and index fingers form a triangle
  const areThumbsTogether = areFingersTogether(leftHand, THUMB_TIP, rightHand, THUMB_TIP)
  const areIndexFingersTogether = areFingersTogether(leftHand, INDEX_TIP, rightHand, INDEX_TIP)
  const isTriangleFormed = 
    Math.abs(leftHand[THUMB_TIP].y - leftHand[INDEX_TIP].y) > 0.1 &&
    Math.abs(rightHand[THUMB_TIP].y - rightHand[INDEX_TIP].y) > 0.1

  return areThumbsTogether && areIndexFingersTogether && isTriangleFormed
}

export const detectSnakeSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Snake seal: left thumb on the outside, fingers vertical
  const isLeftThumbOutside = leftHand[THUMB_TIP].x < leftHand[INDEX_TIP].x
  const areFingersVertical = 
    isFingerStraight(leftHand, INDEX_TIP) &&
    isFingerStraight(rightHand, INDEX_TIP)

  return isLeftThumbOutside && areFingersVertical
}

export const detectOxSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Ox seal: right hand horizontal, left hand vertical
  const isRightHorizontal = Math.abs(rightHand[INDEX_TIP].y - rightHand[PINKY_TIP].y) < 0.1
  const isLeftVertical = Math.abs(leftHand[INDEX_TIP].x - leftHand[PINKY_TIP].x) < 0.1

  return isRightHorizontal && isLeftVertical
}

export const detectDogSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Dog seal: left hand flat on right fist
  const isLeftFlat = Math.abs(leftHand[INDEX_TIP].y - leftHand[PINKY_TIP].y) < 0.1
  const isRightFist = 
    areFingersTogetherSameHand(rightHand, INDEX_TIP, THUMB_TIP) &&
    areFingersTogetherSameHand(rightHand, MIDDLE_TIP, THUMB_TIP)

  return isLeftFlat && isRightFist
}

export const detectHorseSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Horse seal: both elbows out, index fingers form triangle
  const areIndexFingersTogether = areFingersTogether(leftHand, INDEX_TIP, rightHand, INDEX_TIP)
  const isTriangleFormed = 
    Math.abs(leftHand[INDEX_TIP].x - rightHand[INDEX_TIP].x) > 0.2 &&
    Math.abs(leftHand[INDEX_TIP].y - rightHand[INDEX_TIP].y) < 0.1

  return areIndexFingersTogether && isTriangleFormed
}

export const detectTigerSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Tiger seal: both thumbs straight up
  const areThumbsStraightUp = 
    areThumbsUp(leftHand) && areThumbsUp(rightHand)
  const areFingersInterlocked = 
    areFingersTogether(leftHand, INDEX_TIP, rightHand, INDEX_TIP)

  return areThumbsStraightUp && areFingersInterlocked
}

export const detectBoarSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Boar seal: wrists need great flexibility, fingers together
  const areLeftFingersTogether = 
    areFingersTogetherSameHand(leftHand, INDEX_TIP, MIDDLE_TIP) &&
    areFingersTogetherSameHand(leftHand, MIDDLE_TIP, RING_TIP)
  const areRightFingersTogether = 
    areFingersTogetherSameHand(rightHand, INDEX_TIP, MIDDLE_TIP) &&
    areFingersTogetherSameHand(rightHand, MIDDLE_TIP, RING_TIP)

  return areLeftFingersTogether && areRightFingersTogether
}

export const detectRamSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Ram seal: left thumb on top, hands together vertically
  const isLeftThumbOnTop = leftHand[THUMB_TIP].y < rightHand[THUMB_TIP].y
  const areHandsVertical = 
    Math.abs(leftHand[INDEX_TIP].x - leftHand[PINKY_TIP].x) < 0.1 &&
    Math.abs(rightHand[INDEX_TIP].x - rightHand[PINKY_TIP].x) < 0.1

  return isLeftThumbOnTop && areHandsVertical
}

export const detectHareSeal = (hands: HandPosition[]) => {
  if (hands.length !== 2) return false

  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks

  if (!leftHand || !rightHand) return false

  // For Hare seal: aside from pinky, right fingers gently curled
  const areRightFingersCurled = 
    rightHand[INDEX_TIP].y > rightHand[INDEX_TIP - 1].y &&
    rightHand[MIDDLE_TIP].y > rightHand[MIDDLE_TIP - 1].y &&
    rightHand[RING_TIP].y > rightHand[RING_TIP - 1].y
  const isPinkyStraight = isFingerStraight(rightHand, PINKY_TIP)

  return areRightFingersCurled && isPinkyStraight
}

// Main detection function that checks all seals
export const detectHandSeal = (hands: HandPosition[]): string | null => {
  if (detectMonkeySeal(hands)) return 'Monkey'
  if (detectDragonSeal(hands)) return 'Dragon'
  if (detectRatSeal(hands)) return 'Rat'
  if (detectBirdSeal(hands)) return 'Bird'
  if (detectSnakeSeal(hands)) return 'Snake'
  if (detectOxSeal(hands)) return 'Ox'
  if (detectDogSeal(hands)) return 'Dog'
  if (detectHorseSeal(hands)) return 'Horse'
  if (detectTigerSeal(hands)) return 'Tiger'
  if (detectBoarSeal(hands)) return 'Boar'
  if (detectRamSeal(hands)) return 'Ram'
  if (detectHareSeal(hands)) return 'Hare'
  return null
} 