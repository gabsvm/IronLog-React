import React, { Suspense } from 'react';
import { TRANSLATIONS } from '../../constants';
import { pickLang } from '../../utils/i18n';
import type { Lang } from '../../types';

const ConfirmModal = React.lazy(() => import('../../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

export const TemplateChangeConfirmation: React.FC<{ lang: Lang; confirmation: { isOpen: boolean; onConfirm: () => void; onCancel: () => void } }> = ({ lang, confirmation }) => {
    const t = TRANSLATIONS[lang];
    if (!confirmation.isOpen) return null;
    return <Suspense fallback={null}><ConfirmModal {...confirmation} title={t.routineView.replaceTitle} description={pickLang(lang, { es: 'Se perderán los datos sin guardar de esta sesión y se detendrá el descanso.', en: 'Unsaved data from this session will be lost and its rest timer will stop.' })} confirmText={pickLang(lang, { es: 'Descartar y cambiar', en: 'Discard and change' })} cancelText={t.cancel} variant="danger" /></Suspense>;
};
