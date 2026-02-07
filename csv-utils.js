const csvEscape = (value) => {
    const text = value === undefined || value === null ? '' : String(value);
    if (/[",\n\r]/.test(text) || /^\s|\s$/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

const toCsvString = (raw) => {
    if (raw === undefined || raw === null) return '';
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return toCsvString(JSON.parse(trimmed));
            } catch {
                return raw;
            }
        }
        return raw;
    }
    const rows = Array.isArray(raw) ? raw : [raw];
    if (rows.length === 0) return '';

    const allKeys = [];
    rows.forEach((row) => {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
            Object.keys(row).forEach((key) => {
                if (!allKeys.includes(key)) allKeys.push(key);
            });
        }
    });

    if (allKeys.length === 0) {
        const lines = rows.map((row) => {
            if (Array.isArray(row)) return row.map(csvEscape).join(',');
            return csvEscape(row);
        });
        return lines.join('\n');
    }

    const headerLine = allKeys.map(csvEscape).join(',');
    const lines = rows.map((row) => {
        const obj = row && typeof row === 'object' ? row : {};
        return allKeys.map((key) => csvEscape(obj[key])).join(',');
    });
    return [headerLine, ...lines].join('\n');
};

module.exports = { csvEscape, toCsvString };
