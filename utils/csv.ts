/**
 * Q12: minimal RFC 4180 CSV parser/writer (no dependencies).
 * Handles quoted fields, escaped double quotes, commas and newlines inside
 * quotes, CRLF/LF endings, and a leading BOM.
 */

/** Parse CSV text into rows of cells (all strings, unescaped). */
export const parseCsv = (text: string): string[][] => {
    const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    let i = 0;

    const pushCell = () => {
        row.push(cell);
        cell = '';
    };
    const pushRow = () => {
        pushCell();
        rows.push(row);
        row = [];
    };

    while (i < input.length) {
        const ch = input[i]!;
        if (inQuotes) {
            if (ch === '"') {
                if (input[i + 1] === '"') {
                    cell += '"';
                    i += 2;
                } else {
                    inQuotes = false;
                    i += 1;
                }
            } else {
                cell += ch;
                i += 1;
            }
        } else if (ch === '"') {
            inQuotes = true;
            i += 1;
        } else if (ch === ',') {
            pushCell();
            i += 1;
        } else if (ch === '\r' || ch === '\n') {
            pushRow();
            // Consume a single line break (CRLF counts as one).
            if (ch === '\r' && input[i + 1] === '\n') i += 2;
            else i += 1;
        } else {
            cell += ch;
            i += 1;
        }
    }

    // Trailing content without a line break, or a trailing comma's empty cell.
    if (cell !== '' || row.length > 0) pushRow();

    // Drop the phantom row a single trailing newline would add: the loop
    // already pushed the row when it consumed the break.
    return rows;
};

const needsQuoting = (cell: string): boolean =>
    cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r');

/** Escape one value for CSV output. */
export const escapeCsvCell = (value: unknown): string => {
    if (value == null) return '';
    const s = String(value);
    if (!needsQuoting(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
};

/** Serialize rows to CSV text (LF endings, no trailing newline). */
export const toCsv = (rows: unknown[][]): string =>
    rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
