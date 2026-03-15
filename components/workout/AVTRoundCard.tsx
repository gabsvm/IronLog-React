import React from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Icon } from '../ui/Icon';

interface AVTRoundCardProps {
  roundId: number;
  hops: WorkoutSet[];  // todos los WorkoutSet con este avtRoundId
  exInstanceId: number;
  roundNumber: number; // 1, 2, 3...
  unit: string;
  onUpdate: (exId: number, setId: number, field: string, value: any) => void;
  onToggleComplete: (exId: number, setId: number) => void;
  onMarkLastHop: (exId: number, setId: number) => void;
  onAddHop: (exId: number, roundId: number) => void;
}

export const AVTRoundCard: React.FC<AVTRoundCardProps> = ({
  roundId, hops, exInstanceId, roundNumber, unit,
  onUpdate, onToggleComplete, onMarkLastHop, onAddHop
}) => {
  const roundComplete = hops.some(h => h.isLastHop);

  return (
    <div className={`mx-3 mb-3 rounded-2xl border overflow-hidden transition-all
      ${roundComplete 
        ? 'border-green-500/30 bg-green-500/5' 
        : 'border-zinc-700 bg-zinc-900'}`}
    >
      {/* Round Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Round {roundNumber}
          </span>
          {roundComplete && (
            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
              ✓ COMPLETADO
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-500">{hops.length} hops</span>
      </div>

      {/* Hops */}
      <div className="divide-y divide-zinc-800">
        {hops.map((hop, idx) => (
          <HopRow
            key={hop.id}
            hop={hop}
            hopNumber={idx + 1}
            exInstanceId={exInstanceId}
            unit={unit}
            onUpdate={onUpdate}
            onToggleComplete={onToggleComplete}
            onMarkLastHop={onMarkLastHop}
          />
        ))}
      </div>

      {/* Add Hop Button */}
      {!roundComplete && (
        <button
          onClick={() => onAddHop(exInstanceId, roundId)}
          className="w-full py-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors"
        >
          <Icon name="Plus" size={12} /> Agregar hop
        </button>
      )}
    </div>
  );
};

// Sub-componente de fila individual
const HopRow: React.FC<{
  hop: WorkoutSet;
  hopNumber: number;
  exInstanceId: number;
  unit: string;
  onUpdate: (exId: number, setId: number, field: string, value: any) => void;
  onToggleComplete: (exId: number, setId: number) => void;
  onMarkLastHop: (exId: number, setId: number) => void;
}> = ({ hop, hopNumber, exInstanceId, unit, onUpdate, onToggleComplete, onMarkLastHop }) => {
  const [localWeight, setLocalWeight] = React.useState(hop.weight ?? '');
  const [localReps, setLocalReps] = React.useState(hop.reps ?? '');

  const isFailure = hop.isLastHop;
  const isDone = hop.completed;

  return (
    <div className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 transition-colors
      ${isFailure ? 'bg-orange-500/10' : isDone ? 'bg-green-500/5' : ''}`}
    >
      {/* Hop badge */}
      <div className="col-span-1 flex justify-center">
        <span className={`text-[10px] font-black w-5 h-5 rounded flex items-center justify-center
          ${isFailure ? 'text-orange-400 bg-orange-500/20' : isDone ? 'text-green-400' : 'text-zinc-500'}`}>
          {hopNumber}
        </span>
      </div>

      {/* Weight */}
      <div className="col-span-4">
        <input
          type="number" inputMode="decimal"
          className="w-full text-center bg-zinc-800 rounded-xl py-3 text-lg font-bold text-white outline-none focus:ring-1 focus:ring-white/20"
          placeholder={hop.hintWeight ? String(hop.hintWeight) : '—'}
          value={localWeight}
          onChange={e => setLocalWeight(e.target.value)}
          onBlur={() => onUpdate(exInstanceId, hop.id, 'weight', localWeight)}
          disabled={isDone}
        />
      </div>

      {/* Reps */}
      <div className="col-span-3">
        <input
          type="number" inputMode="numeric"
          className="w-full text-center bg-zinc-800 rounded-xl py-3 text-lg font-bold text-white outline-none focus:ring-1 focus:ring-white/20"
          placeholder="reps"
          value={localReps}
          onChange={e => setLocalReps(e.target.value)}
          onBlur={() => onUpdate(exInstanceId, hop.id, 'reps', localReps)}
          disabled={isDone}
        />
      </div>

      {/* Failure button */}
      <div className="col-span-2 flex justify-center">
        <button
          onClick={() => onMarkLastHop(exInstanceId, hop.id)}
          title="Fallo aquí"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 text-xs font-black
            ${isFailure
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-600 hover:bg-orange-500/20 hover:text-orange-400'}`}
        >
          F
        </button>
      </div>

      {/* Complete */}
      <div className="col-span-2 flex justify-center">
        <button
          onClick={() => onToggleComplete(exInstanceId, hop.id)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90
            ${isDone ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
        >
          <Icon name="Check" size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
