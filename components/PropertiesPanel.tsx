import React from 'react';
import { Cue, EffectType, SuitConfig } from '../types';
import { Trash2, Copy, Save, Sun, ArrowUp, ArrowDown, User, ArrowLeft, ArrowRight } from 'lucide-react';

interface PropertiesPanelProps {
  selectedCue: Cue | undefined;
  suits: SuitConfig[];
  onUpdateCue: (id: string, updates: Partial<Cue>) => void;
  onDeleteCue: (id: string) => void;
  onDuplicateCue: (id: string) => void;
}

const EFFECT_TYPES: EffectType[] = [
    'solid', 'chase', 'fill', 'wipe', 
    'body-fill', 'body-wipe', 
    'body-fill-horizontal', 'body-wipe-horizontal',
    'wave', 'fade', 'strobe', 'sparkle', 
    'gradient', 'blend', 'random', 'random-fill'
];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedCue, 
  suits, 
  onUpdateCue, 
  onDeleteCue,
  onDuplicateCue
}) => {
  if (!selectedCue) {
    return (
      <div className="w-80 bg-[#1e1e1e] border-l border-neutral-800 p-6 flex flex-col items-center justify-center text-neutral-500">
        <div className="mb-4 opacity-30">
             <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
             </svg>
        </div>
        <p className="text-sm">Select a cue to edit properties</p>
      </div>
    );
  }

  const currentSuit = suits.find(s => s.id === selectedCue.suitId);
  const isBodyEffect = ['body-fill', 'body-wipe', 'body-fill-horizontal', 'body-wipe-horizontal'].includes(selectedCue.type);
  const isHorizontalBodyEffect = selectedCue.type.includes('horizontal');

  return (
    <div className="w-80 bg-[#1e1e1e] border-l border-neutral-800 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="h-12 border-b border-neutral-800 flex items-center px-4 bg-[#252525]">
        <h2 className="text-cyan-400 font-bold tracking-wider text-sm">PROPERTIES</h2>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Info Header */}
        <div>
            <div className="text-xs text-neutral-500 mb-1">TARGET</div>
            <div className="text-white font-mono text-sm border border-neutral-700 bg-neutral-900 px-3 py-2 rounded">
                {currentSuit?.name || 'Unknown Suit'}
            </div>
        </div>

        {/* Effect Type */}
        <div>
          <label className="text-xs text-neutral-500 block mb-2">EFFECT TYPE</label>
          <div className="grid grid-cols-2 gap-2">
            {EFFECT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => onUpdateCue(selectedCue.id, { type })}
                className={`text-xs py-2 rounded border transition-colors ${
                  selectedCue.type === type
                    ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400'
                    : 'bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {type.toUpperCase().replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Direction Selector (Chase, Fill, Wipe, Body Effects) */}
        {(selectedCue.type === 'chase' || selectedCue.type === 'fill' || selectedCue.type === 'wipe' || isBodyEffect) && (
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700">
                 <label className="text-xs text-cyan-400 block mb-2 font-bold">DIRECTION</label>
                 <div className="flex gap-2">
                     <button
                        onClick={() => onUpdateCue(selectedCue.id, { direction: 'forward' })}
                        className={`flex-1 py-1 text-xs rounded border flex items-center justify-center gap-1 ${
                            selectedCue.direction !== 'backward' 
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-transparent border-neutral-600 text-neutral-400'
                        }`}
                     >
                        {isHorizontalBodyEffect ? <ArrowRight size={12} /> : (isBodyEffect ? <ArrowDown size={12} /> : <ArrowDown size={12} />)} 
                        {isHorizontalBodyEffect ? 'Left -> Right' : (isBodyEffect ? 'Top -> Bottom' : 'Ascending')}
                     </button>
                     <button
                        onClick={() => onUpdateCue(selectedCue.id, { direction: 'backward' })}
                        className={`flex-1 py-1 text-xs rounded border flex items-center justify-center gap-1 ${
                            selectedCue.direction === 'backward' 
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-transparent border-neutral-600 text-neutral-400'
                        }`}
                     >
                        {isHorizontalBodyEffect ? <ArrowLeft size={12} /> : (isBodyEffect ? <ArrowUp size={12} /> : <ArrowUp size={12} />)} 
                        {isHorizontalBodyEffect ? 'Right -> Left' : (isBodyEffect ? 'Bottom -> Top' : 'Descending')}
                     </button>
                 </div>
            </div>
        )}

        {/* Pose Selector (Body Effects Only) */}
        {isBodyEffect && !isHorizontalBodyEffect && (
             <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700">
                 <label className="text-xs text-cyan-400 block mb-2 font-bold flex items-center gap-1">
                     <User size={12}/> POSE
                 </label>
                 <div className="flex gap-2">
                     <button
                        onClick={() => onUpdateCue(selectedCue.id, { pose: 'hands-down' })}
                        className={`flex-1 py-1 text-xs rounded border flex flex-col items-center justify-center gap-1 ${
                            selectedCue.pose === 'hands-down' || !selectedCue.pose
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-transparent border-neutral-600 text-neutral-400'
                        }`}
                     >
                        Hands Down
                     </button>
                     <button
                        onClick={() => onUpdateCue(selectedCue.id, { pose: 'hands-up' })}
                        className={`flex-1 py-1 text-xs rounded border flex flex-col items-center justify-center gap-1 ${
                            selectedCue.pose === 'hands-up' 
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-transparent border-neutral-600 text-neutral-400'
                        }`}
                     >
                        Hands @ Shoulder
                     </button>
                 </div>
                 <p className="text-[10px] text-neutral-500 mt-2">
                    Affects vertical order for arms.
                 </p>
             </div>
        )}

        {/* Variant Selector for Random Effect */}
        {selectedCue.type === 'random' && (
             <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700">
                 <label className="text-xs text-cyan-400 block mb-2 font-bold">DISTRIBUTION MODE</label>
                 <div className="flex gap-2">
                     <button
                        onClick={() => onUpdateCue(selectedCue.id, { variant: 'per-pixel' })}
                        className={`flex-1 py-1 text-xs rounded border ${
                            selectedCue.variant !== 'uniform' 
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-transparent border-neutral-600 text-neutral-400'
                        }`}
                     >
                        Multi-Color
                     </button>
                     <button
                        onClick={() => onUpdateCue(selectedCue.id, { variant: 'uniform' })}
                        className={`flex-1 py-1 text-xs rounded border ${
                            selectedCue.variant === 'uniform' 
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-transparent border-neutral-600 text-neutral-400'
                        }`}
                     >
                        Uniform
                     </button>
                 </div>
                 <p className="text-[10px] text-neutral-500 mt-2">
                    {selectedCue.variant === 'uniform' 
                        ? 'All LEDs change color together.' 
                        : 'Each LED has a unique color.'}
                 </p>
             </div>
        )}

        {/* Colors (Hide for Random since it's auto-generated) */}
        {selectedCue.type !== 'random' && (
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-neutral-500 block mb-2">PRIMARY COLOR</label>
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={selectedCue.color}
                            onChange={(e) => onUpdateCue(selectedCue.id, { color: e.target.value })}
                            className="h-10 w-10 bg-transparent border-0 cursor-pointer"
                        />
                        <input 
                            type="text" 
                            value={selectedCue.color}
                            onChange={(e) => onUpdateCue(selectedCue.id, { color: e.target.value })}
                            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 text-sm font-mono text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                </div>
                
                {(selectedCue.type === 'chase' || selectedCue.type === 'fade' || selectedCue.type === 'gradient' || selectedCue.type === 'blend') && (
                    <div>
                        <label className="text-xs text-neutral-500 block mb-2">SECONDARY COLOR</label>
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={selectedCue.secondaryColor || '#000000'}
                                onChange={(e) => onUpdateCue(selectedCue.id, { secondaryColor: e.target.value })}
                                className="h-10 w-10 bg-transparent border-0 cursor-pointer"
                            />
                            <input 
                                type="text" 
                                value={selectedCue.secondaryColor || '#000000'}
                                onChange={(e) => onUpdateCue(selectedCue.id, { secondaryColor: e.target.value })}
                                className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 text-sm font-mono text-white focus:border-cyan-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Brightness Control */}
        <div>
            <div className="flex justify-between mb-2">
                 <label className="text-xs text-neutral-500 flex items-center gap-1">
                     <Sun size={12} /> BRIGHTNESS
                 </label>
                 <span className="text-xs text-neutral-400 font-mono">
                     {selectedCue.brightness ?? 100}%
                 </span>
            </div>
            <input 
                type="range"
                min="0"
                max="100"
                value={selectedCue.brightness ?? 100}
                onChange={(e) => onUpdateCue(selectedCue.id, { brightness: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
            />
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-xs text-neutral-500 block mb-1">START (ms)</label>
                <input 
                    type="number" 
                    value={Math.round(selectedCue.startTime)}
                    onChange={(e) => onUpdateCue(selectedCue.id, { startTime: parseInt(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-neutral-500 block mb-1">DURATION (ms)</label>
                <input 
                    type="number" 
                    value={Math.round(selectedCue.duration)}
                    onChange={(e) => onUpdateCue(selectedCue.id, { duration: parseInt(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                />
            </div>
        </div>

        {/* LED Range */}
        <div>
             <label className="text-xs text-neutral-500 block mb-2">LED RANGE ({selectedCue.ledRangeStart} - {selectedCue.ledRangeEnd})</label>
             <div className="flex gap-2">
                 <input 
                    type="number"
                    min="0"
                    max="99"
                    value={selectedCue.ledRangeStart}
                    onChange={(e) => onUpdateCue(selectedCue.id, { ledRangeStart: parseInt(e.target.value) })}
                    className="w-1/2 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
                 />
                  <input 
                    type="number"
                    min="0"
                    max="99"
                    value={selectedCue.ledRangeEnd}
                    onChange={(e) => onUpdateCue(selectedCue.id, { ledRangeEnd: parseInt(e.target.value) })}
                    className="w-1/2 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
                 />
             </div>
        </div>

        {/* Effect Parameters */}
        {(selectedCue.type === 'chase' || selectedCue.type === 'strobe' || selectedCue.type === 'wave' || selectedCue.type === 'sparkle' || selectedCue.type === 'random') && (
            <div>
                <label className="text-xs text-neutral-500 block mb-2">SPEED / FREQUENCY</label>
                <input 
                    type="range"
                    min="1"
                    max="50"
                    value={selectedCue.speed || 10}
                    onChange={(e) => onUpdateCue(selectedCue.id, { speed: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500"
                />
                <div className="text-right text-xs text-neutral-400 mt-1">{selectedCue.speed || 10} units</div>
            </div>
        )}

      </div>

      <div className="mt-auto p-4 border-t border-neutral-800 flex gap-2">
         <button 
            onClick={() => onDuplicateCue(selectedCue.id)}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded flex items-center justify-center gap-2 text-xs transition-colors"
         >
             <Copy size={14} /> Duplicate
         </button>
         <button 
            onClick={() => onDeleteCue(selectedCue.id)}
            className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 py-2 rounded flex items-center justify-center gap-2 text-xs transition-colors"
         >
             <Trash2 size={14} /> Delete
         </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;