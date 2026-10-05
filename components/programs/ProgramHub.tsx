import React from 'react';
import { createPortal } from 'react-dom';
import { useProgramHubState, type ProgramHubProps } from './hub/useProgramHubState';
import { HubHeader, HubHome, HubBlock, HubPrinciples, HubRpe, HubSubstitutions, HubProgram, HubProgress } from './hub/HubPanels';

export type { ProgramHubProps } from './hub/useProgramHubState';

export const ProgramHub: React.FC<ProgramHubProps> = (props) => {
  const s = useProgramHubState(props);
  const { panel, block } = s;
  const content = panel === 'home' ? <HubHome s={s} />
    : panel === 'block' ? <HubBlock s={s} />
      : panel === 'principles' ? <HubPrinciples s={s} />
        : panel === 'rpe' ? <HubRpe s={s} />
          : panel === 'substitutions' ? <HubSubstitutions s={s} />
            : panel === 'program' ? <HubProgram s={s} />
              : <HubProgress s={s} />;

  const hub = (
    <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]" role="dialog" aria-modal="true" aria-label="KONG Program Hub">
      <HubHeader s={s} />
      <main className="flex-1 overflow-y-auto scroll-container">
        <div className="mx-auto w-full max-w-xl p-5 pb-[calc(var(--safe-area-bottom)+24px)]">
          {content}
        </div>
      </main>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(hub, document.body) : hub;
};
