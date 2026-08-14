import React, { useState } from 'react';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { KONG_GUIDE } from '../../programs/kong/kongGuide';
import { getProgramBlockForWeek } from '../../programs/engine/ProgramResolver';

interface Props { lang: 'en' | 'es'; onBack: () => void; onStart: () => void; }

export const ProgramDetailView: React.FC<Props> = ({ lang, onBack, onStart }) => {
  const [tab, setTab] = useState<'overview' | 'guide' | 'weeks'>('overview');
  const title = (text: { en: string; es: string }) => text[lang];
  return <div className="fixed inset-0 z-modal overflow-y-auto bg-[#0b0b0d] text-white" role="dialog" aria-modal="true">
    <div className="mx-auto min-h-full w-full max-w-xl p-5 pb-28">
      <button onClick={onBack} className="mb-6 min-h-11 rounded-xl px-3 text-sm font-bold text-zinc-400">← {lang === 'es' ? 'Volver' : 'Back'}</button>
      <div className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-zinc-900 p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-400">KONG</p>
        <h1 className="mt-2 text-3xl font-black">Savage Size · 4 Day</h1>
        <p className="mt-2 text-zinc-400">Alexander Bromley</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold"><span>12 {lang === 'es' ? 'semanas' : 'weeks'}</span><span>4 {lang === 'es' ? 'días' : 'days'}</span><span>3 {lang === 'es' ? 'bloques' : 'blocks'}</span></div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2"><button className={`min-h-11 rounded-xl text-xs font-black ${tab === 'overview' ? 'bg-primary-500 text-black' : 'bg-zinc-900 text-zinc-400'}`} onClick={() => setTab('overview')}>{lang === 'es' ? 'Cómo funciona' : 'How it works'}</button><button className={`min-h-11 rounded-xl text-xs font-black ${tab === 'weeks' ? 'bg-primary-500 text-black' : 'bg-zinc-900 text-zinc-400'}`} onClick={() => setTab('weeks')}>{lang === 'es' ? '12 semanas' : '12 weeks'}</button><button className={`min-h-11 rounded-xl text-xs font-black ${tab === 'guide' ? 'bg-primary-500 text-black' : 'bg-zinc-900 text-zinc-400'}`} onClick={() => setTab('guide')}>{lang === 'es' ? 'Guía' : 'Guide'}</button></div>
      {tab === 'overview' && <div className="mt-5 space-y-3">{KONG_4DAY_V1.blocks.map((block) => <div key={block.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4"><p className="text-xs font-black uppercase text-primary-400">Block {block.number} · {block.globalWeekStart}-{block.globalWeekEnd}</p><h2 className="mt-1 text-lg font-black">{title(block.name)}</h2><p className="mt-1 text-sm text-zinc-400">{title(block.goal)}</p></div>)}</div>}
      {tab === 'weeks' && <div className="mt-5 space-y-2">{KONG_4DAY_V1.blocks.flatMap((block) => block.days.slice(0, 1).map(() => <div key={block.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4"><p className="text-sm font-black">Block {block.number} · {block.globalWeekStart}-{block.globalWeekEnd}</p><p className="mt-1 text-xs text-zinc-400">{block.days.map((day) => title(day.name)).join(' · ')}</p></div>))}</div>}
      {tab === 'guide' && <div className="mt-5 space-y-3">{KONG_GUIDE.slice(0, 7).map((section) => <div key={section.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4"><h2 className="font-black">{title(section.title)}</h2><p className="mt-1 text-sm leading-6 text-zinc-400">{title(section.summary)}</p></div>)}</div>}
      <button onClick={onStart} className="fixed bottom-5 left-5 right-5 mx-auto min-h-12 max-w-xl rounded-2xl bg-primary-500 px-5 font-black text-black shadow-lg shadow-primary-500/20">{lang === 'es' ? 'Comenzar KONG' : 'Start KONG'}</button>
    </div>
  </div>;
};
