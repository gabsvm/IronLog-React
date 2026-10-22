import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRef, useState } from 'react';
import { useAppHistory } from '../../hooks/useAppHistory';

function useNavigation() {
    const [view, setView] = useState('home');
    const target = useRef(view);
    useAppHistory(view, setView, target);
    return { view, setView };
}

afterEach(() => {
    window.history.replaceState({ view: 'home' }, '', '#home');
});

describe('child navigation preserves the originating root', () => {
    it('returns from the library to Routine and supports Forward without another entry', async () => {
        const { result } = renderHook(useNavigation);
        act(() => result.current.setView('routine'));
        act(() => result.current.setView('exercises'));
        act(() => window.history.back());
        await waitFor(() => expect(result.current.view).toBe('routine'));
        act(() => window.history.forward());
        await waitFor(() => expect(result.current.view).toBe('exercises'));
        act(() => window.history.back());
        await waitFor(() => expect(result.current.view).toBe('routine'));
    });

    it('Back from a completed workout summary never resurrects the workout', async () => {
        const { result } = renderHook(useNavigation);
        act(() => result.current.setView('diary'));
        act(() => result.current.setView('workout'));
        act(() => result.current.setView('summary'));
        act(() => window.history.back());
        await waitFor(() => expect(result.current.view).toBe('diary'));
        act(() => window.history.forward());
        await waitFor(() => expect(result.current.view).toBe('summary'));
    });
    it('modal popstate leaves the current root view intact without triggering a transition away', async () => {
        const { result } = renderHook(useNavigation);
        act(() => result.current.setView('home'));
        act(() => {
            window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'home' } }));
        });
        await waitFor(() => expect(result.current.view).toBe('home'));
    });
});
