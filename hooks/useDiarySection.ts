import { useLocalStorage } from './useLocalStorage';
import type { DiarySection } from '../components/layout/navigation';

/**
 * Persisted diary section: survives view switches and reloads.
 * Lives outside views/DiaryView so the entry chunk does not absorb the
 * (lazy) Diary container module.
 */
export function useDiarySection(): [DiarySection, (section: DiarySection) => void] {
    return useLocalStorage<DiarySection>('il_diary_section_v1', 'sessions');
}
