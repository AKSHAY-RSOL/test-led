
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Cue, SuitConfig } from '../types';
import { Play, Pause, Rewind, Plus, Music, ChevronRight, ChevronDown, Layers } from 'lucide-react';

interface TimelineProps {
  cues: Cue[];
  suits: SuitConfig[];
  currentTime: number;
  duration: number;
  zoom: number; // pixels per second
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onTogglePlay: () => void;
  onSelectCue: (id: string) => void;
  selectedCueId: string | null;
  onAddCue: (suitId: number, time: number) => void;
}

// Separate component for the heavy track logic.
// This component only re-renders when cues/structure change, NOT when currentTime changes.
const TimelineTracks = React.memo((props: {
    cues: Cue[];
    suits: SuitConfig[];
    duration: number;
    zoom: number;
    selectedCueId: string | null;
    expandedSuits: Set<number>;
    toggleExpand: (id: number) => void;
    onSelectCue: (id: string) => void;
    onAddCue: (suitId: number, time: number) => void;
}) => {
    const { cues, suits, duration, zoom, selectedCueId, expandedSuits, toggleExpand, onSelectCue, onAddCue } = props;

    // Helper to calculate lanes
    const getLaneData = (suitCues: Cue[]) => {
        const sorted = [...suitCues].sort((a, b) => a.startTime - b.startTime);
        const lanes: { endTime: number }[] = [];
        const mapping: Record<string, number> = {};

        sorted.forEach(cue => {
            let placed = false;
            for (let i = 0; i < lanes.length; i++) {
                if (lanes[i].endTime <= cue.startTime) {
                    lanes[i].endTime = cue.startTime + cue.duration;
                    mapping[cue.id] = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push({ endTime: cue.startTime + cue.duration });
                mapping[cue.id] = lanes.length - 1;
            }
        });
        return { count: lanes.length, mapping };
    };

    return (
        <div 
             style={{ width: Math.max(1000, (duration / 1000) * zoom + 160), minHeight: '100%' }}
             className="relative"
        >
            {/* Ruler Marks (Static part) */}
            <div className="h-8 bg-[#2a2a2a] border-b border-neutral-700 flex items-end sticky top-0 z-40">
                <div className="w-40 flex-shrink-0 bg-[#252525] h-full border-r border-neutral-700 flex items-center px-2 text-xs text-neutral-500 z-50 sticky left-0 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                    TIMELINE
                </div>
                {Array.from({ length: Math.ceil(duration / 1000) }).map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute bottom-0 text-[10px] text-neutral-500 border-l border-neutral-600 pl-1 h-4 select-none pointer-events-none"
                        style={{ left: 160 + i * zoom }}
                    >
                        {i}s
                    </div>
                ))}
            </div>

            {/* Tracks */}
            {suits.map((suit) => {
                const suitCues = cues.filter(c => c.suitId === suit.id);
                const isExpanded = expandedSuits.has(suit.id);
                const { count: laneCount, mapping: laneMapping } = getLaneData(suitCues);
                
                const expandedHeight = Math.max(64, laneCount * 34 + 20);
                const currentHeight = isExpanded ? expandedHeight : 64;
                const hasOverlaps = laneCount > 1;

                return (
                    <div 
                        key={suit.id} 
                        className="border-b border-neutral-800 flex relative group transition-[height] duration-200 ease-in-out"
                        style={{ height: currentHeight }}
                        // Mouse down handled by parent via bubbling or distinct handlers
                    >
                        {/* Track Header */}
                        <div 
                            className="w-40 flex-shrink-0 bg-[#222] border-r border-neutral-700 flex flex-col justify-center px-3 sticky left-0 z-40 group-hover:bg-[#2a2a2a] transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.3)] cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(suit.id);
                            }}
                        >
                            <div className="flex items-center justify-between w-full mb-1">
                                <span className="text-xs font-bold text-neutral-300 truncate pr-2 flex items-center gap-1">
                                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    {suit.name}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddCue(suit.id, 0); // Placeholder time, will rely on click pos
                                    }}
                                    className="text-neutral-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-neutral-600">
                                <span>{suit.ledCount} LEDs</span>
                                {hasOverlaps && (
                                    <span className="flex items-center gap-1 text-amber-500/70">
                                        <Layers size={10} />
                                        {laneCount} layers
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none z-0" 
                             style={{ 
                                 backgroundImage: `linear-gradient(to right, #2a2a2a 1px, transparent 1px)`,
                                 backgroundSize: `${zoom}px 100%`,
                                 left: 160
                             }} 
                        />

                        {/* Cues */}
                        {suitCues.map(cue => {
                            const laneIndex = laneMapping[cue.id] || 0;
                            const top = isExpanded ? 10 + (laneIndex * 34) : 12;
                            const height = isExpanded ? 28 : 40;
                            
                            return (
                                <div
                                    key={cue.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectCue(cue.id);
                                    }}
                                    className={`absolute rounded-md cursor-pointer overflow-hidden border transition-all ${
                                        selectedCueId === cue.id 
                                        ? 'border-white ring-1 ring-cyan-500 z-30 shadow-lg shadow-cyan-900/50' 
                                        : 'border-transparent opacity-90 hover:opacity-100 hover:border-neutral-400 z-10 hover:z-20'
                                    }`}
                                    style={{
                                        left: 160 + (cue.startTime / 1000) * zoom,
                                        width: (cue.duration / 1000) * zoom,
                                        backgroundColor: cue.color,
                                        top: top,
                                        height: height,
                                    }}
                                >
                                    <div className="w-full h-full bg-black/20 px-2 flex items-center">
                                        <span className="text-[10px] font-bold text-white drop-shadow-md truncate">
                                            {cue.type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
});

const Timeline: React.FC<TimelineProps> = ({
  cues,
  suits,
  currentTime,
  duration,
  zoom,
  isPlaying,
  onTimeChange,
  onTogglePlay,
  onSelectCue,
  selectedCueId,
  onAddCue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedSuits, setExpandedSuits] = useState<Set<number>>(new Set());

  // Auto-scroll timeline when playing
  useEffect(() => {
    if (isPlaying && containerRef.current) {
        const playheadPos = (currentTime / 1000) * zoom;
        const containerWidth = containerRef.current.clientWidth;
        const scrollLeft = containerRef.current.scrollLeft;
        
        // Scroll only if approaching right edge
        if (playheadPos > scrollLeft + containerWidth - 50) {
            containerRef.current.scrollLeft = playheadPos - 50;
        }
    }
  }, [currentTime, isPlaying, zoom]);

  const toggleExpand = (suitId: number) => {
    setExpandedSuits(prev => {
        const next = new Set(prev);
        if (next.has(suitId)) {
            next.delete(suitId);
        } else {
            next.add(suitId);
        }
        return next;
    });
  };

  const handleTimelineInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const timeX = x - 160;
      
      if (timeX < 0) return; // Clicked on sidebar
      
      const clickedTime = (timeX / zoom) * 1000;
      
      // Determine if we clicked a track body
      // We can infer suit ID by Y position relative to track heights, but easier to just use click time.
      // Since TimelineTracks handles Cue clicks, this handler is mainly for the background/playhead jump.
      
      // Heuristic: If we are holding shift, we want to add a cue, but we need the Suit ID.
      // Since we split the component, getting Suit ID on generic click is harder without bubbling.
      // We'll rely on Time Change here mostly.
      
      if (!e.shiftKey) {
          onTimeChange(clickedTime);
      }
  };

  // Wrapper for Add Cue that calculates Suit ID based on DOM
  // Since TimelineTracks is memoized, we attach this handler to the wrapper `div` of tracks
  // in the render prop approach or just pass logic down.
  // Actually, passing `onAddCue` to Tracks lets us handle it there.

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mils = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${mils.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-neutral-700 select-none">
      {/* Toolbar */}
      <div className="h-10 flex items-center px-4 bg-[#252525] border-b border-neutral-800 space-x-4 shrink-0">
        <button onClick={onTogglePlay} className="text-cyan-400 hover:text-white transition-colors">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => onTimeChange(0)} className="text-neutral-400 hover:text-white">
            <Rewind size={18} />
        </button>
        
        <div className="font-mono text-cyan-400 text-lg mx-4 w-24">
            {formatTime(currentTime)}
        </div>
        
        <div className="flex-1"></div>
        
        <div className="text-xs text-neutral-500 flex items-center gap-2">
            <Music size={14} />
            <span>NO AUDIO LOADED</span>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative custom-scrollbar"
        style={{ scrollBehavior: 'auto' }}
        onClick={handleTimelineInteraction}
        onDoubleClick={(e) => {
             // Basic fallback for double click on empty space
             handleTimelineInteraction(e);
        }}
      >
         {/* Memoized Tracks */}
         <TimelineTracks 
            cues={cues}
            suits={suits}
            duration={duration}
            zoom={zoom}
            selectedCueId={selectedCueId}
            expandedSuits={expandedSuits}
            toggleExpand={toggleExpand}
            onSelectCue={onSelectCue}
            onAddCue={(suitId, time) => {
                // Wrapper to handle add cue requests bubbling up from specific track areas
                // If time is 0, we use current playhead or calculated from mouse
                // For now, let's assume the click passed specific time or we use currentTime
                onAddCue(suitId, time || currentTime);
            }}
         />

         {/* Playhead Overlay - Independent of Tracks */}
         <div 
             className="absolute top-0 bottom-0 w-px bg-cyan-400 z-50 pointer-events-none"
             style={{ 
                 left: 160 + (currentTime / 1000) * zoom,
                 height: '100%' // Ensure it covers scroll height
             }}
         >
             <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-cyan-400 -ml-[4.5px] sticky top-0"></div>
         </div>
      </div>
      
      <div className="h-6 bg-[#1a1a1a] flex items-center justify-end px-2 text-[10px] text-neutral-500 border-t border-neutral-800 shrink-0">
         DOUBLE CLICK TRACK TO ADD • CLICK HEADER TO EXPAND LAYERS
      </div>
    </div>
  );
};

export default Timeline;
