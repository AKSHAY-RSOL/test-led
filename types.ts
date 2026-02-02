export type EffectType = 'solid' | 'chase' | 'fill' | 'wipe' | 'body-fill' | 'body-wipe' | 'body-fill-horizontal' | 'body-wipe-horizontal' | 'wave' | 'fade' | 'strobe' | 'sparkle' | 'gradient' | 'blend' | 'random' | 'random-fill';

export interface LEDPosition {
  x: number;
  y: number;
  id: number; // Global index within the suit
  part: string;
}

export interface SuitConfig {
  id: number;
  name: string;
  ledCount: number;
  parts: {
    [key: string]: number; // e.g., head: 10
  };
}

export interface Cue {
  id: string;
  suitId: number;
  startTime: number; // milliseconds
  duration: number; // milliseconds
  type: EffectType;
  color: string; // Hex color
  secondaryColor?: string; // For gradients/chases
  variant?: 'per-pixel' | 'uniform'; // For random effect
  direction?: 'forward' | 'backward'; // For chase/fill/body-fill
  pose?: 'hands-down' | 'hands-up'; // For body-fill spatial calculation
  speed?: number; // For dynamic effects
  brightness?: number; // 0-100
  ledRangeStart: number;
  ledRangeEnd: number;
  selected?: boolean;
}

export interface ProjectState {
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
  zoom: number; // Pixels per second
  cues: Cue[];
  selectedCueId: string | null;
  suits: SuitConfig[];
}