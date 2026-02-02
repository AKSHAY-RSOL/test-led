
import { Cue, SuitConfig, EffectType } from '../types';

/**
 * Helper to convert HSL to Packed RGB Integer (0xRRGGBB)
 * h, s, l are in [0, 1]
 */
function hslToRgbInt(h: number, s: number, l: number): number {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(b * 255);
  
  return (rInt << 16) | (gInt << 8) | bInt;
}

/**
 * Helper to parse Hex String to Integer
 */
const parseHexToInt = (hex: string): number => {
    return parseInt(hex.replace(/^#/, ''), 16);
}

/**
 * Maps an LED index to an approximate X position (0.0 Left, 1.0 Right).
 */
const getApproximateX = (index: number): number => {
    // Ranges derived from prompt 1-based indices converted to 0-based
    if (index <= 32) return 0.45; // R Torso
    if (index <= 68) return 0.42; // R Pocket
    if (index <= 96) { // R Arm Down
        const t = (index - 69) / 27;
        return 0.35 - (t * 0.25);
    }
    if (index <= 102) return 0.05; // R Fingers
    if (index <= 142) { // R Arm Upper
        const t = (index - 103) / 39;
        return 0.1 + (t * 0.25);
    }
    if (index <= 183) return 0.5; // Hat/Face
    if (index <= 222) { // L Arm Up
        const t = (index - 184) / 38;
        return 0.65 + (t * 0.25);
    }
    if (index <= 228) return 0.95; // L Fingers
    if (index <= 258) { // L Arm Down
        const t = (index - 229) / 29;
        return 0.9 - (t * 0.25);
    }
    if (index <= 291) return 0.58; // L Pocket
    if (index <= 330) return 0.55; // L Torso
    if (index <= 381) return 0.55 + ((index - 331) / 50) * 0.1; // L Leg Outer
    if (index <= 422) return 0.65 - ((index - 382) / 40) * 0.15; // L Leg Inner
    if (index <= 463) return 0.5 - ((index - 423) / 40) * 0.15; // R Leg Inner
    if (index <= 527) return 0.35 + ((index - 464) / 63) * 0.1; // R Leg Outer
    if (index <= 540) return 0.65; // L Leg Outer Extension
    return 0.5;
};

/**
 * Maps an LED index to an approximate Y position (0.0 top, 1.0 bottom).
 */
const getApproximateY = (
    index: number, 
    pose: 'hands-down' | 'hands-up' = 'hands-down',
    direction: 'forward' | 'backward' = 'forward',
    effectType: EffectType = 'body-fill'
): number => {
    // Anatomy Constants
    const TOP = 0.0;
    const SHOULDER = 0.20;
    const WAIST = 0.50;
    const FEET = 1.0;
    const WRIST = pose === 'hands-down' ? 0.60 : SHOULDER;

    if (index <= 32) return WAIST - ((index / 32) * (WAIST - SHOULDER));
    if (index <= 68) return effectType === 'body-wipe' && direction === 'backward' ? FEET : WAIST;
    if (index <= 96) return SHOULDER + ((index - 69) / 27) * (WRIST - SHOULDER);
    if (index <= 102) return WRIST + 0.05;
    if (index <= 142) return WRIST - ((index - 103) / 39) * (WRIST - SHOULDER);
    if (index <= 183) return TOP;
    if (index <= 222) return SHOULDER + ((index - 184) / 38) * (WRIST - SHOULDER);
    if (index <= 228) return WRIST + 0.05;
    if (index <= 258) return WRIST - ((index - 229) / 29) * (WRIST - SHOULDER);
    if (index <= 291) return effectType === 'body-wipe' && direction === 'backward' ? FEET : WAIST;
    if (index <= 330) return SHOULDER + ((index - 292) / 38) * (WAIST - SHOULDER);
    if (index <= 381) return WAIST + ((index - 331) / 50) * (FEET - WAIST);
    if (index <= 422) return FEET - ((index - 382) / 40) * (FEET - WAIST);
    if (index <= 463) return WAIST + ((index - 423) / 40) * (FEET - WAIST);
    if (index <= 527) return FEET - ((index - 464) / 63) * (FEET - WAIST);
    if (index <= 540) return FEET;
    return 0.5;
};

// Helper: Linear Interpolation for Integers
function lerpInt(color1: number, color2: number, factor: number): number {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return (r << 16) | (g << 8) | b;
}

// Helper: Adjust Brightness for Integer
function dimInt(color: number, factor: number): number {
    const r = Math.round(((color >> 16) & 0xFF) * factor);
    const g = Math.round(((color >> 8) & 0xFF) * factor);
    const b = Math.round((color & 0xFF) * factor);
    return (r << 16) | (g << 8) | b;
}

/**
 * Calculates the color contribution of a single cue as a 32-bit Integer.
 */
const getCueColorContributionInt = (
  cue: Cue,
  ledIndex: number,
  currentTime: number
): number => {
  const relativeTime = currentTime - cue.startTime;
  
  // Parse base colors once. 
  // Optimization: In a real "Entity Component System", we would pre-parse these onto the cue object.
  // For now, parseInt is fast enough compared to the allocation overhead of strings.
  const baseColorInt = parseHexToInt(cue.color);
  let finalColorInt = baseColorInt;

  switch (cue.type) {
    case 'solid':
      break;

    case 'strobe': {
      const frequency = cue.speed || 10;
      const on = Math.floor(relativeTime / (1000 / frequency)) % 2 === 0;
      if (!on) return 0; // Black
      break;
    }

    case 'chase': {
      const speed = cue.speed || 20; 
      const progress = (relativeTime / 1000) * speed;
      const rangeWidth = cue.ledRangeEnd - cue.ledRangeStart;
      if (rangeWidth <= 0) return 0;
      
      const isBackward = cue.direction === 'backward';
      let activeIndex = Math.floor(progress) % rangeWidth;
      
      if (isBackward) activeIndex = (rangeWidth - 1) - activeIndex;

      const relativeLedIndex = ledIndex - cue.ledRangeStart;
      const isTrail = isBackward 
        ? (relativeLedIndex === activeIndex + 1 || (activeIndex === rangeWidth - 1 && relativeLedIndex === 0))
        : (relativeLedIndex === activeIndex - 1 || (activeIndex === 0 && relativeLedIndex === rangeWidth - 1));

      if (relativeLedIndex === activeIndex) {
          finalColorInt = baseColorInt;
      } else if (isTrail) {
          finalColorInt = dimInt(baseColorInt, 0.5);
      } else {
          finalColorInt = cue.secondaryColor ? parseHexToInt(cue.secondaryColor) : 0;
      }
      break;
    }

    case 'fill': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const rangeWidth = cue.ledRangeEnd - cue.ledRangeStart;
        const relativeLedIndex = ledIndex - cue.ledRangeStart;
        const filledCount = Math.floor(progress * rangeWidth);
        const isBackward = cue.direction === 'backward';
        let isOn = false;

        if (isBackward) {
            if (relativeLedIndex >= rangeWidth - filledCount) isOn = true;
        } else {
            if (relativeLedIndex < filledCount) isOn = true;
        }
        if (!isOn) return 0;
        break;
    }

    case 'wipe': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const rangeWidth = cue.ledRangeEnd - cue.ledRangeStart;
        const relativeLedIndex = ledIndex - cue.ledRangeStart;
        const wipedCount = Math.floor(progress * rangeWidth);
        const isBackward = cue.direction === 'backward';
        let isOn = false;

        if (isBackward) {
            if (relativeLedIndex < rangeWidth - wipedCount) isOn = true;
        } else {
            if (relativeLedIndex >= wipedCount) isOn = true;
        }
        if (!isOn) return 0;
        break;
    }

    case 'body-fill': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const ledY = getApproximateY(ledIndex, cue.pose, cue.direction, 'body-fill'); 
        const isBottomToTop = cue.direction === 'backward';
        let isOn = false;
        if (isBottomToTop) {
            const threshold = 1.05 - (progress * 1.1);
            if (ledY >= threshold) isOn = true;
        } else {
            const threshold = -0.05 + (progress * 1.1);
            if (ledY <= threshold) isOn = true;
        }
        if (!isOn) return 0;
        break;
    }

    case 'body-wipe': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const ledY = getApproximateY(ledIndex, cue.pose, cue.direction, 'body-wipe');
        const isBottomToTop = cue.direction === 'backward';
        let isOn = false;
        if (isBottomToTop) {
            const threshold = 1.05 - (progress * 1.1);
            if (ledY < threshold) isOn = true;
        } else {
            const threshold = -0.05 + (progress * 1.1);
            if (ledY > threshold) isOn = true;
        }
        if (!isOn) return 0;
        break;
    }

    case 'body-fill-horizontal': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const ledX = getApproximateX(ledIndex);
        const isRightToLeft = cue.direction === 'backward';
        let isOn = false;
        if (isRightToLeft) {
            const threshold = 1.05 - (progress * 1.1);
            if (ledX >= threshold) isOn = true;
        } else {
            const threshold = -0.05 + (progress * 1.1);
            if (ledX <= threshold) isOn = true;
        }
        if (!isOn) return 0;
        break;
    }

    case 'body-wipe-horizontal': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const ledX = getApproximateX(ledIndex);
        const isRightToLeft = cue.direction === 'backward';
        let isOn = false;
        if (isRightToLeft) {
            const threshold = 1.05 - (progress * 1.1);
            if (ledX < threshold) isOn = true;
        } else {
            const threshold = -0.05 + (progress * 1.1);
            if (ledX > threshold) isOn = true;
        }
        if (!isOn) return 0;
        break;
    }

    case 'fade': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const secColorInt = cue.secondaryColor ? parseHexToInt(cue.secondaryColor) : 0;
        finalColorInt = lerpInt(secColorInt, baseColorInt, progress);
        break;
    }

    case 'blend': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const secColorInt = cue.secondaryColor ? parseHexToInt(cue.secondaryColor) : 0;
        finalColorInt = lerpInt(baseColorInt, secColorInt, progress);
        break;
    }

    case 'wave': {
        const speed = (cue.speed || 5) / 1000;
        const wave = Math.sin(relativeTime * speed + ledIndex * 0.5);
        const brightness = (wave + 1) / 2;
        finalColorInt = dimInt(baseColorInt, brightness);
        break;
    }

    case 'sparkle': {
        const frequency = cue.speed || 15;
        const timeStep = Math.floor(relativeTime / (1000 / frequency));
        const seed = (ledIndex * 12.9898) + (timeStep * 78.233); 
        const rand = Math.abs(Math.sin(seed) * 43758.5453) % 1;
        if (rand <= 0.8) return 0;
        break;
    }

    case 'gradient': {
        const rangeWidth = cue.ledRangeEnd - cue.ledRangeStart;
        if (rangeWidth > 1) {
            const position = ledIndex - cue.ledRangeStart;
            const progress = Math.max(0, Math.min(1, position / (rangeWidth - 1)));
            const secColorInt = cue.secondaryColor ? parseHexToInt(cue.secondaryColor) : 0;
            finalColorInt = lerpInt(baseColorInt, secColorInt, progress);
        }
        break;
    }

    case 'random': {
        const frequency = cue.speed || 10;
        const stepDuration = Math.max(1, 1000 / frequency);
        const timeStep = Math.floor(relativeTime / stepDuration);
        const isUniform = cue.variant === 'uniform';
        const spatialSeed = isUniform ? 0 : ledIndex * 999.9;
        const seed = (timeStep * 43758.5453) + spatialSeed;
        const randH = Math.abs(Math.sin(seed)) % 1;
        finalColorInt = hslToRgbInt(randH, 1, 0.5);
        break;
    }

    case 'random-fill': {
        const progress = Math.min(1, Math.max(0, relativeTime / cue.duration));
        const seed = (ledIndex * 9301 + 49297) % 233280;
        const threshold = seed / 233280.0;
        if (progress < threshold) return 0;
        break;
    }
  }

  // Global Brightness Factor
  if (cue.brightness !== undefined && cue.brightness < 100) {
      finalColorInt = dimInt(finalColorInt, Math.max(0, cue.brightness) / 100);
  }

  return finalColorInt;
};

/**
 * Filter active cues once per frame
 */
export const getActiveCuesForFrame = (
    cues: Cue[],
    suitId: number,
    currentTime: number
): Cue[] => {
    return cues.filter(
        (c) =>
          c.suitId === suitId &&
          currentTime >= c.startTime &&
          currentTime < c.startTime + c.duration
      );
}

/**
 * Calculates the final color of a specific LED by blending active cues.
 * Returns a 32-bit Integer (0xRRGGBB).
 */
export const calculateLedColor = (
  ledIndex: number,
  currentTime: number,
  activeCues: Cue[] 
): number => {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  // Additive Blending in Integer Space
  for (let i = 0; i < activeCues.length; i++) {
      const cue = activeCues[i];
      // Quick Range Check
      if (ledIndex < cue.ledRangeStart || ledIndex > cue.ledRangeEnd) continue;

      const colorInt = getCueColorContributionInt(cue, ledIndex, currentTime);
      
      // Unpack and Accumulate
      totalR += (colorInt >> 16) & 0xFF;
      totalG += (colorInt >> 8) & 0xFF;
      totalB += colorInt & 0xFF;
  }

  if (totalR === 0 && totalG === 0 && totalB === 0) return 0x333333; // Off/Dim

  const finalR = Math.min(255, totalR);
  const finalG = Math.min(255, totalG);
  const finalB = Math.min(255, totalB);

  return (finalR << 16) | (finalG << 8) | finalB;
};

/**
 * Helper to convert integer color to hex string for Canvas/CSS
 */
export const intToHex = (color: number): string => {
    // 0xRRGGBB -> "#RRGGBB"
    // Using string concat is faster than template literals in hot loops in V8
    return '#' + ('000000' + color.toString(16)).slice(-6);
}

// Interfaces for saving/loading
interface SavedProjectData {
    suits: SuitConfig[];
    cues: Cue[];
    duration: number;
    version: string;
}

const SAVE_START_MARKER = "/*__LUMINA_SAVE_DATA_START__";
const SAVE_END_MARKER = "__LUMINA_SAVE_DATA_END__*/";

export const parseProjectFromCode = (fileContent: string): SavedProjectData | null => {
    const startIndex = fileContent.indexOf(SAVE_START_MARKER);
    const endIndex = fileContent.indexOf(SAVE_END_MARKER);

    if (startIndex === -1 || endIndex === -1) return null;

    try {
        const jsonString = fileContent.substring(
            startIndex + SAVE_START_MARKER.length,
            endIndex
        );
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse project data:", error);
        return null;
    }
}

export const generateFastLedCode = (suits: SuitConfig[], cues: Cue[], totalDuration: number): string => {
  const codeLines: string[] = [];
  const projectData: SavedProjectData = { suits, cues, duration: totalDuration, version: '1.0.0' };
  
  codeLines.push(SAVE_START_MARKER);
  codeLines.push(JSON.stringify(projectData));
  codeLines.push(SAVE_END_MARKER);
  codeLines.push(``);
  codeLines.push(`// Generated by Lumina Choreographer`);
  codeLines.push(`#include <FastLED.h>`);
  codeLines.push(`#if defined(__AVR__)`);
  codeLines.push(`#include <avr/pgmspace.h>`);
  codeLines.push(`#else`);
  codeLines.push(`#define PROGMEM`);
  codeLines.push(`#define memcpy_P memcpy`);
  codeLines.push(`#endif`);
  codeLines.push(``);
  codeLines.push(`#define NUM_SUITS ${suits.length}`);
  const maxLeds = Math.max(...suits.map(s => s.ledCount));
  codeLines.push(`#define MAX_LEDS_PER_SUIT ${maxLeds}`);
  codeLines.push(``);
  
  const SAFE_PINS = [4, 16, 17, 18, 19, 21, 22, 23, 25, 26]; 
  suits.forEach((s, i) => {
      const pin = SAFE_PINS[i] !== undefined ? SAFE_PINS[i] : 13 + i; 
      codeLines.push(`#define PIN_SUIT_${i} ${pin}`);
  });
  
  codeLines.push(``);
  codeLines.push(`CRGB leds[NUM_SUITS][MAX_LEDS_PER_SUIT];`);
  codeLines.push(``);
  codeLines.push(`struct Cmd { uint32_t ms; uint8_t suit; uint16_t led; uint8_t r, g, b; };`);
  codeLines.push(``);
  codeLines.push(`const Cmd choreography[] PROGMEM = {`);

  const sampleRate = 50; 
  const stateCache: Record<number, number[]> = {};
  
  suits.forEach(s => {
      stateCache[s.id] = new Array(s.ledCount).fill(0);
  });

  let eventCount = 0;

  for (let t = 0; t <= totalDuration; t += sampleRate) {
      suits.forEach(suit => {
          const activeCues = getActiveCuesForFrame(cues, suit.id, t);
          const cache = stateCache[suit.id];
          
          for (let i = 0; i < suit.ledCount; i++) {
               const colorInt = calculateLedColor(i, t, activeCues);
               
               let r = 0, g = 0, b = 0;
               if (colorInt !== 0x333333) { // If not default dim
                   r = (colorInt >> 16) & 0xFF;
                   g = (colorInt >> 8) & 0xFF;
                   b = colorInt & 0xFF;
               }
               
               const prevColorInt = cache[i];
               
               // Delta compression check
               // We compare the final RGB values, not including the 0x333333 placeholder logic for caching
               // Actually we should store exactly what we emitted.
               // If emitted r,g,b is different from prev r,g,b.
               
               const prevR = (prevColorInt >> 16) & 0xFF;
               const prevG = (prevColorInt >> 8) & 0xFF;
               const prevB = prevColorInt & 0xFF;

               if (r !== prevR || g !== prevG || b !== prevB) {
                   codeLines.push(`  {${t}, ${suit.id}, ${i}, ${r}, ${g}, ${b}},`);
                   cache[i] = (r << 16) | (g << 8) | b;
                   eventCount++;
               }
          }
      });
  }

  codeLines.push(`};`);
  codeLines.push(``);
  codeLines.push(`const uint32_t FRAME_COUNT = ${eventCount};`);
  codeLines.push(`const uint32_t TOTAL_DURATION = ${totalDuration};`);
  
  codeLines.push(``);
  codeLines.push(`void setup() {`);
  codeLines.push(`  delay(1000);`);
  suits.forEach((s, i) => {
      codeLines.push(`  FastLED.addLeds<WS2812B, PIN_SUIT_${i}, GRB>(leds[${i}], ${s.ledCount});`);
  });
  codeLines.push(`  FastLED.clear(); FastLED.show();`);
  codeLines.push(`}`);
  codeLines.push(``);
  codeLines.push(`void loop() {`);
  codeLines.push(`  static uint32_t startTime = 0;`);
  codeLines.push(`  static uint32_t cursor = 0;`);
  codeLines.push(`  if (startTime == 0) startTime = millis();`);
  codeLines.push(`  uint32_t now = millis() - startTime;`);
  codeLines.push(`  bool updated = false;`);
  codeLines.push(`  while (cursor < FRAME_COUNT) {`);
  codeLines.push(`    Cmd cmd; memcpy_P(&cmd, &choreography[cursor], sizeof(Cmd));`);
  codeLines.push(`    if (cmd.ms > now) break;`);
  codeLines.push(`    if (cmd.suit < NUM_SUITS && cmd.led < MAX_LEDS_PER_SUIT) {`);
  codeLines.push(`      leds[cmd.suit][cmd.led] = CRGB(cmd.r, cmd.g, cmd.b);`);
  codeLines.push(`      updated = true;`);
  codeLines.push(`    }`);
  codeLines.push(`    cursor++;`);
  codeLines.push(`  }`);
  codeLines.push(`  if (updated) FastLED.show();`);
  codeLines.push(`  if (now > TOTAL_DURATION) { startTime = millis(); cursor = 0; FastLED.clear(); FastLED.show(); }`);
  codeLines.push(`}`);

  return codeLines.join('\n');
};
