import React from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { PROJECT_LICENSE, PROJECT_LINKS } from '../../../constants/project';
import { Icon } from '../../ui/Icon';

const LinkRow: React.FC<{ href: string; icon: string; label: string; detail?: string }> = ({ href, icon, label, detail }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-sm font-medium text-[rgb(var(--text-primary))]"
    >
        <Icon name={icon} size={18} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1">{label}</span>
        {detail && <span className="shrink-0 text-xs text-muted">{detail}</span>}
        <Icon name="ExternalLink" size={16} className="shrink-0 text-muted" />
    </a>
);

/** Open-source project links: source code always, support only once a donation page exists. */
export const ProjectSection: React.FC = () => {
    const { lang } = useApp();
    const ty = TRANSLATIONS[lang].you;
    return (
        <div id="profile-section-project">
            <div className="label-reference px-1 mb-1.5">{ty.project}</div>
            <div className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden">
                <LinkRow href={PROJECT_LINKS.source} icon="Code" label={ty.sourceCode} detail={PROJECT_LICENSE} />
                {PROJECT_LINKS.donate && <LinkRow href={PROJECT_LINKS.donate} icon="Heart" label={ty.supportProject} />}
            </div>
        </div>
    );
};
