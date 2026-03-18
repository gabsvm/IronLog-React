// components/ui/PDFImportModal.tsx
import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ProgramDay, ProgramSlot, MuscleGroup } from '../../types';
import { Icon } from './Icon';
import { Button } from './Button';

// @ts-ignore - pdf.worker.mjs?url is a Vite-specific import that TS might not resolve correctly during npx tsc
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Worker para pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface PDFImportModalProps {
  onClose: () => void;
  onImport: (days: ProgramDay[]) => void;
}

// Mapa de keywords a MuscleGroups
const MUSCLE_KEYWORDS: Record<string, MuscleGroup> = {
  'bench': 'CHEST', 'press': 'CHEST', 'chest': 'CHEST', 'pec': 'CHEST',
  'squat': 'QUADS', 'leg press': 'QUADS', 'quad': 'QUADS', 'lunge': 'QUADS',
  'deadlift': 'BACK', 'row': 'BACK', 'pull': 'BACK', 'lat': 'BACK', 'back': 'BACK',
  'curl': 'BICEPS', 'bicep': 'BICEPS',
  'tricep': 'TRICEPS', 'pushdown': 'TRICEPS', 'extension': 'TRICEPS',
  'shoulder': 'SHOULDERS', 'lateral': 'SHOULDERS', 'delt': 'SHOULDERS', 'overhead': 'SHOULDERS',
  'hamstring': 'HAMSTRINGS', 'rdl': 'HAMSTRINGS', 'leg curl': 'HAMSTRINGS',
  'calf': 'CALVES', 'raise': 'CALVES',
  'trap': 'TRAPS', 'shrug': 'TRAPS',
  'glute': 'GLUTES', 'hip thrust': 'GLUTES',
  'ab': 'ABS', 'crunch': 'ABS', 'plank': 'ABS',
};

function inferMuscle(exerciseName: string): MuscleGroup {
  const lower = exerciseName.toLowerCase();
  for (const [keyword, muscle] of Object.entries(MUSCLE_KEYWORDS)) {
    if (lower.includes(keyword)) return muscle as MuscleGroup;
  }
  return 'CHEST'; // fallback
}

// Parser principal — adaptado para formato Jacked in 3 y programas genéricos
function parseProgramText(text: string): ProgramDay[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const days: ProgramDay[] = [];
  let currentDay: ProgramDay | null = null;

  // Patterns para detectar días: "Day A", "Day 1", "Upper", "Lower", "Workout A", etc.
  const dayPattern = /^(day\s*[a-z0-9]+|upper|lower|workout\s*[a-z0-9]+|push|pull|legs)/i;
  // Patterns para detectar ejercicios con sets x reps: "3 x 6", "3x6", "3 rounds"
  const setsPattern = /(\d+)\s*[x×]\s*([\d\-]+)|(\d+)\s*rounds?/i;
  // AVT/hop pattern: "hop|avt|accumulative"
  const avtPattern = /hop|avt|accumulative/i;

  for (const line of lines) {
    if (dayPattern.test(line)) {
      if (currentDay) days.push(currentDay);
      currentDay = {
        id: `imported_${Date.now()}_${days.length}`,
        dayName: { en: line, es: line },
        slots: []
      };
      continue;
    }

    if (!currentDay) {
      // Si no hay día definido aún, crear uno genérico
      currentDay = {
        id: `imported_${Date.now()}_0`,
        dayName: { en: 'Day A', es: 'Día A' },
        slots: []
      };
    }

    const setsMatch = line.match(setsPattern);
    if (setsMatch) {
      const setCount = parseInt(setsMatch[1] || setsMatch[3]) || 3;
      const reps = setsMatch[2] || '6-8';
      const isAVT = avtPattern.test(line);
      const exerciseName = line.replace(setsPattern, '').replace(/[-:,]/g, '').trim();

      if (exerciseName.length > 2) {
        const slot: ProgramSlot = {
          muscle: inferMuscle(exerciseName),
          setTarget: setCount,
          reps: isAVT ? `${reps} (AVT)` : reps,
          isAVT: isAVT,
          avtRounds: isAVT ? setCount : undefined,
          avtStartReps: isAVT ? parseInt(reps) || 6 : undefined,
        };
        currentDay.slots.push(slot);
      }
    }
  }

  if (currentDay && currentDay.slots.length > 0) days.push(currentDay);
  return days;
}

export const PDFImportModal: React.FC<PDFImportModalProps> = ({ onClose, onImport }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedDays, setParsedDays] = useState<ProgramDay[]>([]);
  const [rawText, setRawText] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setRawText(text);
        const days = parseProgramText(text);
        if (days.length === 0) {
          setError('No se pudo detectar estructura de programa. Intentá editar el texto manualmente abajo.');
        }
        setParsedDays(days);
        setStep('preview');
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setRawText(text);
        const days = parseProgramText(text);
        setParsedDays(days);
        setStep('preview');
      } else {
        setError('Formato no soportado. Usá PDF o .txt');
      }
    } catch (err) {
      setError('Error al procesar el archivo. Probá con un PDF sin protección.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleConfirm = () => {
    onImport(parsedDays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-end justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-700 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-black text-white">Importar Programa</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === 'upload' ? 'PDF o .txt de tu programa' : `${parsedDays.length} días detectados`}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <Icon name="X" size={20} />
          </button>
        </div>

        {step === 'upload' && (
          <div className="p-5 space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-2xl p-8 text-center transition-colors cursor-pointer"
              onClick={() => document.getElementById('pdf-file-input')?.click()}
            >
              <Icon name="Upload" size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-bold text-zinc-400">Arrastrá tu PDF aquí</p>
              <p className="text-xs text-zinc-600 mt-1">o tocá para seleccionar</p>
              <p className="text-[10px] text-zinc-700 mt-3">PDF • TXT — Max 10MB</p>
            </div>

            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-zinc-400 py-4">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Procesando PDF...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Manual text input fallback */}
            <div>
              <p className="text-xs text-zinc-600 mb-2">O pegá el texto del programa directamente:</p>
              <textarea
                className="w-full bg-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none resize-none h-28 font-mono"
                placeholder={"Day A\nBench Press 3 x 6 hops\nIncline DB 3 x 8\n\nDay B\nSquat 3 x 6 AVT\n..."}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
              {rawText.trim().length > 10 && (
                <button
                  onClick={() => {
                    const days = parseProgramText(rawText);
                    setParsedDays(days);
                    setStep('preview');
                  }}
                  className="mt-2 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300 transition-colors"
                >
                  Parsear texto →
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {parsedDays.map((day, di) => (
              <div key={day.id} className="bg-zinc-800/50 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{day.dayName.en}</span>
                  <span className="text-[10px] text-zinc-500">{day.slots.length} ejercicios</span>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {day.slots.map((slot, si) => (
                    <div key={si} className="px-4 py-2 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${slot.isAVT ? 'bg-orange-400' : 'bg-zinc-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-300 truncate">{slot.muscle}</span>
                          {slot.isAVT && (
                            <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">AVT</span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {slot.setTarget} {slot.isAVT ? 'rounds' : 'sets'} × {slot.reps?.replace(' (AVT)', '')} reps
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-zinc-400 transition-colors"
              >
                Volver
              </button>
              <Button fullWidth onClick={handleConfirm} size="md">
                Importar programa →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
