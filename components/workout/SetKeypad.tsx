// Task 5 (Strong parity): in-app numeric keypad for set entry (Strong
// keyboard_log_workout.xml parity). Controlled and stateless by design: the
// row owns the text via localWeight/localReps + scheduleCommit; the keypad
// only maps taps to onChange/onNext/onDone. Rendered only when visible.
import React, { useCallback } from 'react';
import { TRANSLATIONS } from '../../constants/translations';

export interface SetKeypadProps {
    value: string;
    onChange(v: string): void;
    onNext(): void;
    onDone(): void;
    visible: boolean;
}

// Mirrors bootLanguage's default (Spanish) for the fixed-signature keypad:
// the lang store lives in AppContext, which this signature cannot receive.
const readKeypadLang = (): 'en' | 'es' => {
    try {
        const raw = window.localStorage.getItem('il_lang_v1');
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed === 'en' || parsed === 'es') return parsed;
    } catch {
        /* fall through to default */
    }
    return 'es';
};

const appendDigit = (value: string, digit: string): string => {
    if (value === '' || value === '0') return digit;
    return `${value}${digit}`;
};

const appendDecimal = (value: string): string => {
    if (value === '' || value === '0') return '0.';
    if (value.includes('.') || value.includes(',')) return value;
    return `${value}.`;
};

export const SetKeypad: React.FC<SetKeypadProps> = ({ value, onChange, onNext, onDone, visible }) => {
    const t = TRANSLATIONS[readKeypadLang()];

    const handleDigit = useCallback((digit: string) => {
        onChange(appendDigit(value, digit));
    }, [onChange, value]);

    const handleDecimal = useCallback((sep: ',' | '.') => {
        // The commit path normalizes ',' -> '.'; both keys stay locale-friendly.
        onChange(sep === ',' ? appendDecimal(value).replace('.', ',') : appendDecimal(value));
    }, [onChange, value]);

    const handleBackspace = useCallback(() => {
        onChange(value.slice(0, -1));
    }, [onChange, value]);

    if (!visible) return null;

    // Keep native focus in the row input so blur-driven commits don't fire
    // mid-entry; focus moves only via Next/Done/tapping another input.
    const keepFocus: React.PointerEventHandler<HTMLButtonElement> = (e) => e.preventDefault();
    const keepFocusMouse: React.MouseEventHandler<HTMLButtonElement> = (e) => e.preventDefault();

    const keyClass =
        'flex min-h-[44px] items-center justify-center rounded-[10px] bg-surface-elevated ' +
        'text-lg font-bold text-[rgb(var(--text-primary))] tabular-nums select-none touch-manipulation ' +
        'transition-colors active:bg-primary-500 active:text-zinc-950';
    const actionClass =
        'flex min-h-[44px] w-full items-center justify-center rounded-[10px] tabular-nums select-none touch-manipulation ' +
        'transition-colors active:bg-primary-500 active:text-zinc-950';

    return (
        <div
            data-testid="set-keypad"
            className="set-keypad fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-raised/95 backdrop-blur"
            style={{ height: 220 }}
        >
            <div className="mx-auto grid h-full w-full max-w-3xl grid-cols-4 grid-rows-4 gap-1.5 px-3 pb-safe pt-2">
                {['1', '2', '3'].map((d) => (
                    <button key={d} type="button" className={keyClass}
                        onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                        onClick={() => handleDigit(d)}>{d}</button>
                ))}
                <button type="button" className={keyClass} aria-label={t.delete}
                    data-testid="set-keypad-back"
                    onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                    onClick={handleBackspace}>
                    <span aria-hidden="true">⌫</span>
                </button>
                {['4', '5', '6'].map((d) => (
                    <button key={d} type="button" className={keyClass}
                        onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                        onClick={() => handleDigit(d)}>{d}</button>
                ))}
                <button type="button" data-testid="set-keypad-next"
                    onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                    onClick={onNext}
                    className={`${actionClass} row-span-2 bg-surface-elevated px-1 text-center text-[13px] font-bold uppercase tracking-wide text-[rgb(var(--accent-text))]`}>
                    {t.tutorial.next}
                </button>
                {['7', '8', '9'].map((d) => (
                    <button key={d} type="button" className={keyClass}
                        onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                        onClick={() => handleDigit(d)}>{d}</button>
                ))}
                <button type="button" className={keyClass}
                    onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                    onClick={() => handleDecimal(',')}>,</button>
                <button type="button" className={keyClass}
                    onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                    onClick={() => handleDecimal('.')}>.</button>
                <button type="button" className={keyClass}
                    onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                    onClick={() => handleDigit('0')}>0</button>
                <button type="button" data-testid="set-keypad-done"
                    onPointerDown={keepFocus} onMouseDown={keepFocusMouse}
                    onClick={onDone}
                    className={`${actionClass} bg-primary-500 px-1 text-center text-[13px] font-bold uppercase tracking-wide text-zinc-950`}>
                    {t.exerciseCard.done}
                </button>
            </div>
        </div>
    );
};
