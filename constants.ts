import { SuitConfig } from './types';

export const COLORS = {
  background: '#1a1a1a',
  panel: '#262626',
  accent: '#00d9ff', // Neon Blue
  timelineTrack: '#333333',
  text: '#e5e5e5',
  success: '#10b981',
};

// Updated logical LED distribution based on "Wearer's Perspective"
// Total LEDs: 541
export const DEFAULT_SUITS: SuitConfig[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  name: `Dancer ${i + 1}`,
  ledCount: 541, 
  parts: {
    rTorso: 33,      // 0-32
    rPocket: 36,     // 33-68
    rArmDown: 28,    // 69-96
    rFingers: 6,     // 97-102
    rArmUpper: 40,   // 103-142
    face: 41,        // 143-183
    lArmUp: 39,      // 184-222
    lFingers: 6,     // 223-228
    lArmDown: 30,    // 229-258
    lPocket: 33,     // 259-291
    lTorso: 39,      // 292-330
    lLegOuter: 51,   // 331-381
    lLegInner: 41,   // 382-422
    rLegInner: 41,   // 423-463
    rLegOuter: 64,   // 464-527
    lLegOuterExt: 13 // 528-540
  }
}));

export const SAMPLE_CUES = [
  {
    id: '1',
    suitId: 0,
    startTime: 1000,
    duration: 2000,
    type: 'solid',
    color: '#ff0000',
    ledRangeStart: 0,
    ledRangeEnd: 541,
  },
  {
    id: '2',
    suitId: 2,
    startTime: 2500,
    duration: 3000,
    type: 'chase',
    color: '#00d9ff',
    secondaryColor: '#000000',
    speed: 5,
    ledRangeStart: 143, // Face start
    ledRangeEnd: 183,   // Face end
  },
] as const;