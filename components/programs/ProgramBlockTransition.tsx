import { formatMessage } from '../../utils/i18n';
import React from 'react';
import { getKongBlockDisplay } from '../../programs/kong/kongDisplay';
import { TRANSLATIONS } from '../../constants/translations';

export const ProgramBlockTransition: React.FC<{ blockNumber: number; onClose: () => void; lang: 'en' | 'es' }> = ({ blockNumber, onClose, lang }) => {
  const isSecond = blockNumber === 2;
  const blockName = getKongBlockDisplay(blockNumber)[lang];
  const eyebrow = formatMessage(TRANSLATIONS[lang].copy.programBlockTransition.block, { blockNumber });
  const description = isSecond
    ? (TRANSLATIONS[lang].copy.programBlockTransition.capacityBuiltCompoundsReturn)
    : (TRANSLATIONS[lang].copy.programBlockTransition.nowPrioritizeHeavierLoading);

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center overflow-y-auto bg-black/70 p-4 pb-safe pt-safe backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-primary-500/30 bg-[rgb(var(--surface-raised))] p-6 text-[rgb(var(--text-primary))] shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500">KONG · {eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black leading-tight">{blockName}</h1>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">{description}</p>
        <div className="mt-5 rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3 text-xs font-bold leading-5 text-[rgb(var(--text-secondary))]">
          {isSecond
            ? (TRANSLATIONS[lang].copy.programBlockTransition.keyPoint1210)
            : (TRANSLATIONS[lang].copy.programBlockTransition.keyPointTakeThe)}
        </div>
        <button onClick={onClose} className="mt-6 min-h-12 w-full rounded-2xl bg-primary-500 px-4 font-black text-black active:scale-[0.99]">
          {TRANSLATIONS[lang].copy.programBlockTransition.continue}
        </button>
      </div>
    </div>
  );
};
