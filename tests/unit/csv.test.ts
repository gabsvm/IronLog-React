import { describe, it, expect } from 'vitest';
import { parseCsv, toCsv } from '../../utils/csv';

describe('Q12: RFC 4180 CSV parser/writer', () => {
    it('parses simple rows with LF and CRLF', () => {
        expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
        expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
    });

    it('handles quoted commas, escaped quotes and multiline fields', () => {
        const text = 'name,note\n"Bench, Barbell","say ""hi"""\n"multi\nline",x';
        expect(parseCsv(text)).toEqual([
            ['name', 'note'],
            ['Bench, Barbell', 'say "hi"'],
            ['multi\nline', 'x'],
        ]);
    });

    it('keeps empty cells and tolerates a trailing newline and BOM', () => {
        expect(parseCsv('\uFEFFa,b,\n1,,3\n')).toEqual([['a', 'b', ''], ['1', '', '3']]);
    });

    it('round-trips through the writer with minimal quoting', () => {
        const rows = [['a', 'b,c', 'd"e', 'f\ng'], ['1', '2', '3', '4']];
        const text = toCsv(rows);
        expect(text).toBe('a,"b,c","d""e","f\ng"\n1,2,3,4');
        expect(parseCsv(text)).toEqual(rows);
    });

    it('writes an empty string for null/undefined and plain numbers as-is', () => {
        expect(toCsv([[null, undefined, 0, 62.5]])).toBe(',,0,62.5');
    });
});
