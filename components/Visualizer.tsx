
import React, { useRef, useEffect, useMemo } from 'react';
import { SuitConfig, Cue, LEDPosition } from '../types';
import { calculateLedColor, getActiveCuesForFrame, intToHex } from '../services/ledEngine';

interface VisualizerProps {
  suits: SuitConfig[];
  currentTime: number;
  cues: Cue[];
  onLedClick: (suitId: number, ledIndex: number) => void;
  isPlaying: boolean;
  videoUrl: string | null;
}

// Flattened Geometry Object for Canvas Drawing
interface FlattenedSuitGeometry {
    suitId: number;
    suitName: string;
    offsetX: number;
    offsetY: number;
    strips: {
        path: Path2D; // Pre-calculated path for the strip backing
        points: LEDPosition[]; // Pre-calculated points for LEDs
    }[];
    allLeds: { x: number, y: number, id: number }[]; // For fast hit testing / looping
}

// Logical dimensions of the scene
const SCENE_WIDTH = 1050; 
const SCENE_HEIGHT = 500;

const Visualizer: React.FC<VisualizerProps> = ({ 
    suits, 
    currentTime, 
    cues, 
    onLedClick, 
    isPlaying,
    videoUrl 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // -- GEOMETRY CALCULATION (Run once per suit layout change) --
  const geometry = useMemo(() => {
    // Helper helpers
    const interpolate = (start: {x: number, y: number}, end: {x: number, y: number}, fraction: number) => ({
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction
    });

    const generatePoints = (count: number, fn: (t: number) => {x:number, y:number}, startIndex: number, part: string) => {
        const pts: LEDPosition[] = [];
        for(let i=0; i<count; i++) {
            const t = i / (count - 1 || 1);
            const pos = fn(t);
            pts.push({ id: startIndex + i, part, ...pos });
        }
        return pts;
    };

    const geometries: FlattenedSuitGeometry[] = [];
    
    suits.forEach((suit, index) => {
        const offsetX = 50 + (index * 200);
        const offsetY = 50; 
        const center = { x: offsetX + 50, y: offsetY + 50 };
        
        // ANATOMY CONFIG
        const shoulderY = center.y + 10; 
        const hipY = center.y + 100;
        const kneeY = hipY + 60;
        const ankleY = kneeY + 50;
        const shoulderWidth = 40;
        const hipWidth = 22;
        const ankleStance = 40;
        const elbowY = shoulderY + 30;
        const wristY = elbowY + 30;
        
        const shoulderR = { x: center.x - shoulderWidth, y: shoulderY };
        const shoulderL = { x: center.x + shoulderWidth, y: shoulderY };
        const hipR = { x: center.x - hipWidth, y: hipY };
        const hipL = { x: center.x + hipWidth, y: hipY };
        const elbowR = { x: shoulderR.x - 20, y: elbowY };
        const wristR = { x: elbowR.x - 20, y: wristY };
        const elbowL = { x: shoulderL.x + 20, y: elbowY };
        const wristL = { x: elbowL.x + 20, y: wristY };
        const kneeR = { x: hipR.x - 10, y: kneeY };
        const ankleR = { x: center.x - ankleStance, y: ankleY };
        const kneeL = { x: hipL.x + 10, y: kneeY };
        const ankleL = { x: center.x + ankleStance, y: ankleY };

        let idx = 0;
        const suitStrips = [];
        const suitLeds: { x: number, y: number, id: number }[] = [];

        const addStrip = (name: string, count: number, points: LEDPosition[], closeLoop: boolean = false) => {
            const path = new Path2D();
            if (points.length > 0) {
                path.moveTo(points[0].x, points[0].y);
                for(let i=1; i<points.length; i++) path.lineTo(points[i].x, points[i].y);
                if (closeLoop) path.closePath();
            }
            suitStrips.push({ path, points });
            points.forEach(p => suitLeds.push({ x: p.x, y: p.y, id: p.id }));
            idx += count;
        };

        // 1. R Torso
        const zipperRBottom = { x: hipR.x + 8, y: hipR.y };
        const zipperRTop = { x: shoulderR.x + 20, y: shoulderY };
        addStrip('rTorso', 33, generatePoints(33, t => interpolate(zipperRBottom, zipperRTop, t), idx, 'rTorso'));

        // 2. R Pocket (Rect)
        const rPocketCenter = { x: shoulderR.x + 22, y: shoulderY + 35 };
        const pocketSize = 14;
        const half = pocketSize/2;
        const tl = {x: rPocketCenter.x-half, y: rPocketCenter.y-half};
        const tr = {x: rPocketCenter.x+half, y: rPocketCenter.y-half};
        const br = {x: rPocketCenter.x+half, y: rPocketCenter.y+half};
        const bl = {x: rPocketCenter.x-half, y: rPocketCenter.y+half};
        const perimeter = pocketSize*4;
        const getRectPos = (t:number) => {
            const d = t * perimeter;
            if (d<=pocketSize) return interpolate(tl,tr,d/pocketSize);
            if (d<=pocketSize*2) return interpolate(tr,br,(d-pocketSize)/pocketSize);
            if (d<=pocketSize*3) return interpolate(br,bl,(d-pocketSize*2)/pocketSize);
            return interpolate(bl,tl,(d-pocketSize*3)/pocketSize);
        }
        addStrip('rPocket', 36, generatePoints(36, getRectPos, idx, 'rPocket'), true);

        // 3. R Arm Down (Poly)
        const rArmPts = [shoulderR, elbowR, wristR];
        const getPolyPos = (t: number, pts: {x:number, y:number}[]) => {
            if (t <= 0.5) return interpolate(pts[0], pts[1], t*2);
            return interpolate(pts[1], pts[2], (t-0.5)*2);
        };
        addStrip('rArmDown', 28, generatePoints(28, t => getPolyPos(t, rArmPts), idx, 'rArmDown'));

        // 4. R Fingers (Loop)
        addStrip('rFingers', 6, generatePoints(6, t => {
            const ang = t * Math.PI * 2;
            return { x: wristR.x + Math.cos(ang)*5, y: wristR.y + Math.sin(ang)*5 };
        }, idx, 'rFingers'), true);

        // 5. R Arm Upper
        const wristRInner = { x: wristR.x + 6, y: wristR.y + 4 };
        const elbowRInner = { x: elbowR.x + 6, y: elbowR.y + 4 };
        const armpitR = { x: shoulderR.x + 5, y: shoulderY + 15 };
        addStrip('rArmUpper', 40, generatePoints(40, t => getPolyPos(t, [wristRInner, elbowRInner, armpitR]), idx, 'rArmUpper'));

        // 6. Face
        const headCenter = { x: center.x, y: shoulderY - 25 };
        addStrip('face', 41, generatePoints(41, t => {
            const startAng = Math.PI/2;
            const endAng = -Math.PI*1.5;
            const ang = startAng + (endAng - startAng) * t;
            return { x: headCenter.x + Math.cos(ang)*18, y: headCenter.y + Math.sin(ang)*22 };
        }, idx, 'face'), true);

        // 7. L Arm Up (Poly)
        addStrip('lArmUp', 39, generatePoints(39, t => getPolyPos(t, [shoulderL, elbowL, wristL]), idx, 'lArmUp'));

        // 8. L Fingers
        addStrip('lFingers', 6, generatePoints(6, t => {
             const ang = t * Math.PI * 2;
            return { x: wristL.x + Math.cos(ang)*5, y: wristL.y + Math.sin(ang)*5 };
        }, idx, 'lFingers'), true);

        // 9. L Arm Down
        const wristLInner = { x: wristL.x - 6, y: wristL.y + 4 };
        const elbowLInner = { x: elbowL.x - 6, y: elbowL.y + 4 };
        const armpitL = { x: shoulderL.x - 5, y: shoulderY + 15 };
        addStrip('lArmDown', 30, generatePoints(30, t => getPolyPos(t, [wristLInner, elbowLInner, armpitL]), idx, 'lArmDown'));

        // 10. L Pocket
        const lPocketCenter = { x: shoulderL.x - 22, y: shoulderY + 35 };
        const tlL = {x: lPocketCenter.x-half, y: lPocketCenter.y-half};
        const trL = {x: lPocketCenter.x+half, y: lPocketCenter.y-half};
        const brL = {x: lPocketCenter.x+half, y: lPocketCenter.y+half};
        const blL = {x: lPocketCenter.x-half, y: lPocketCenter.y+half};
        const getRectPosL = (t:number) => {
             const d = t * perimeter;
             if (d<=pocketSize) return interpolate(tlL,trL,d/pocketSize);
             if (d<=pocketSize*2) return interpolate(trL,brL,(d-pocketSize)/pocketSize);
             if (d<=pocketSize*3) return interpolate(brL,blL,(d-pocketSize*2)/pocketSize);
             return interpolate(blL,tlL,(d-pocketSize*3)/pocketSize);
        }
        addStrip('lPocket', 33, generatePoints(33, getRectPosL, idx, 'lPocket'), true);

        // 11. L Torso
        const zipperLTop = { x: shoulderL.x - 20, y: shoulderY };
        const zipperLBottom = { x: hipL.x - 8, y: hipL.y };
        addStrip('lTorso', 39, generatePoints(39, t => interpolate(zipperLTop, zipperLBottom, t), idx, 'lTorso'));

        // 12. L Leg Outer
        addStrip('lLegOuter', 51, generatePoints(51, t => getPolyPos(t, [hipL, kneeL, ankleL]), idx, 'lLegOuter'));

        // 13. L Leg Inner
        const crotch = { x: center.x, y: hipY + 15 };
        const ankleLInner = { x: ankleL.x - 8, y: ankleL.y };
        const kneeLInner = { x: kneeL.x - 8, y: kneeL.y };
        addStrip('lLegInner', 41, generatePoints(41, t => getPolyPos(t, [ankleLInner, kneeLInner, crotch]), idx, 'lLegInner'));

        // 14. R Leg Inner
        const ankleRInner = { x: ankleR.x + 8, y: ankleR.y };
        const kneeRInner = { x: kneeR.x + 8, y: kneeR.y };
        addStrip('rLegInner', 41, generatePoints(41, t => getPolyPos(t, [crotch, kneeRInner, ankleRInner]), idx, 'rLegInner'));

        // 15. R Leg Outer
        addStrip('rLegOuter', 64, generatePoints(64, t => getPolyPos(t, [ankleR, kneeR, hipR]), idx, 'rLegOuter'));

        // 16. L Leg Outer Ext
        addStrip('lLegOuterExt', 13, generatePoints(13, t => interpolate({x: ankleL.x, y: ankleL.y - 10}, ankleL, t), idx, 'lLegOuterExt'));

        geometries.push({
            suitId: suit.id,
            suitName: suit.name,
            offsetX,
            offsetY,
            strips: suitStrips,
            allLeds: suitLeds
        });
    });

    return geometries;
  }, [suits]);

  // -- RENDER LOOP --
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      // Handle HiDPI Canvas
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
      }

      const drawFrame = () => {
          ctx.clearRect(0, 0, rect.width, rect.height);

          // Calculate Scale to Fit
          const scaleX = rect.width / SCENE_WIDTH;
          const scaleY = rect.height / SCENE_HEIGHT;
          const scale = Math.min(scaleX, scaleY) * 0.95; // 95% fit
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const sceneCenterX = SCENE_WIDTH / 2;
          const sceneCenterY = SCENE_HEIGHT / 2;

          // Apply Transform
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(scale, scale);
          ctx.translate(-sceneCenterX, -sceneCenterY);
          
          geometry.forEach(suitGeo => {
             // 1. Draw Suit Name
             ctx.fillStyle = '#333';
             ctx.font = 'bold 10px monospace';
             ctx.textAlign = 'center';
             ctx.fillText(suitGeo.suitName.toUpperCase(), suitGeo.offsetX + 50, suitGeo.offsetY + 340);

             // 2. Draw Backing Strips
             ctx.strokeStyle = '#1f1f1f';
             ctx.lineWidth = 6;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             
             suitGeo.strips.forEach(strip => {
                 ctx.stroke(strip.path);
             });

             // 3. Draw LEDs
             const activeCues = getActiveCuesForFrame(cues, suitGeo.suitId, currentTime);

             suitGeo.allLeds.forEach((led) => {
                 const colorInt = calculateLedColor(led.id, currentTime, activeCues);
                 
                 // If default dim color (0x333333)
                 const isOff = colorInt === 0x333333;
                 const radius = isOff ? 1.5 : 3.5;
                 
                 ctx.beginPath();
                 ctx.arc(led.x, led.y, radius, 0, Math.PI * 2);
                 
                 // Convert INT color to Hex String for Canvas
                 ctx.fillStyle = intToHex(colorInt);
                 
                 if (!isOff) {
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 4;
                 } else {
                    ctx.shadowBlur = 0;
                 }
                 
                 ctx.fill();
             });
             ctx.shadowBlur = 0;
          });
          
          ctx.restore();
      };

      drawFrame();

  }, [currentTime, cues, geometry]); 

  // -- VIDEO SYNC --
  useEffect(() => {
      if (!videoRef.current) return;
      if (isPlaying) {
          videoRef.current.play().catch(e => console.log("Video play interrupted", e));
      } else {
          videoRef.current.pause();
      }
  }, [isPlaying]);

  useEffect(() => {
      if (!videoRef.current) return;
      const videoTime = videoRef.current.currentTime;
      const appTimeSec = currentTime / 1000;
      const diff = Math.abs(videoTime - appTimeSec);
      if (diff > 0.2 || (!isPlaying && diff > 0.05)) {
          videoRef.current.currentTime = appTimeSec;
      }
  }, [currentTime, isPlaying]);

  // -- INTERACTION --
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate inverse transform to map click back to logical coordinates
      const scaleX = rect.width / SCENE_WIDTH;
      const scaleY = rect.height / SCENE_HEIGHT;
      const scale = Math.min(scaleX, scaleY) * 0.95;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const sceneCenterX = SCENE_WIDTH / 2;
      const sceneCenterY = SCENE_HEIGHT / 2;
      
      // Transform logic: 
      // Screen = (Logical - SceneCenter) * Scale + Center
      // Logical = (Screen - Center) / Scale + SceneCenter
      
      const logicalX = (x - centerX) / scale + sceneCenterX;
      const logicalY = (y - centerY) / scale + sceneCenterY;

      for (const suitGeo of geometry) {
          for (const led of suitGeo.allLeds) {
              const dx = logicalX - led.x;
              const dy = logicalY - led.y;
              // Adjusted hit radius for scale
              if (dx*dx + dy*dy <= 25) { 
                  onLedClick(suitGeo.suitId, led.id);
                  return;
              }
          }
      }
  };

  return (
    <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center border-r border-neutral-800">
      {videoUrl && (
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain opacity-40"
                muted={false} 
              />
          </div>
      )}
      <div className="absolute top-4 left-4 text-neutral-600 font-mono text-xs pointer-events-none z-20">
        <div>VISUALIZER // {suits.length} SUITS</div>
        <div className="text-neutral-700 mt-1">RENDERER: HTML5 CANVAS (SCALED)</div>
      </div>
      <div className="z-10 relative w-full h-full">
         <canvas 
            ref={canvasRef}
            className="w-full h-full block cursor-pointer"
            onClick={handleCanvasClick}
         />
      </div>
    </div>
  );
};

export default Visualizer;
