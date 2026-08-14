import React from 'react';
import { getKongBlockDisplay } from '../../programs/kong/kongDisplay';

export const ProgramBlockTransition: React.FC<{ blockNumber: number; onClose: () => void; lang: 'en' | 'es' }> = ({ blockNumber, onClose, lang }) => {
  const isSecond = blockNumber === 2;
  const blockName = getKongBlockDisplay(blockNumber)[lang];
  const eyebrow = lang === 'es' ? `BLOQUE ${blockNumber}` : `BLOCK ${blockNumber}`;
  const description = isSecond
    ? (lang === 'es'
        ? 'Capacidad construida. Los movimientos compuestos vuelven al frente y todas las series de la pirámide cuentan como trabajo.'
        : 'Capacity built. Compounds return to the front and every pyramid set counts as working volume.')
    : (lang === 'es'
        ? 'Ahora priorizas las cargas altas estando fresco. El top set va primero y los backoffs de altas repeticiones siguen siendo parte central del trabajo.'
        : 'Now prioritize heavier loading while fresh. The top set comes first and high-rep backoffs remain central to the work.');

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center overflow-y-auto bg-black/70 p-4 pb-safe pt-safe backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-primary-500/30 bg-[rgb(var(--surface-raised))] p-6 text-[rgb(var(--text-primary))] shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500">KONG · {eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black leading-tight">{blockName}</h1>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">{description}</p>
        <div className="mt-5 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3 text-xs font-bold leading-5 text-[rgb(var(--text-secondary))]">
          {isSecond
            ? (lang === 'es' ? 'Clave: 12/10/8 también son series de trabajo; no las trates como simples calentamientos.' : 'Key point: 12/10/8 are working sets too; do not treat them as passive warmups.')
            : (lang === 'es' ? 'Clave: usa las warmups necesarias para aprender las variantes de sobrecarga antes del top set.' : 'Key point: take the warmups you need to learn the overload variations before the top set.')}
        </div>
        <button onClick={onClose} className="mt-6 min-h-12 w-full rounded-2xl bg-primary-500 px-4 font-black text-black active:scale-[0.99]">
          {lang === 'es' ? 'Continuar' : 'Continue'}
        </button>
      </div>
    </div>
  );
};
