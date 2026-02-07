const { toCsvString, csvEscape } = require('../csv-utils');

describe('csvEscape', () => {
    test('returns empty string for undefined or null', () => {
        expect(csvEscape(undefined)).toBe('');
        expect(csvEscape(null)).toBe('');
    });

    test('returns string representation of non-string values', () => {
        expect(csvEscape(123)).toBe('123');
        expect(csvEscape(true)).toBe('true');
    });

    test('returns input string if no special characters', () => {
        expect(csvEscape('hello')).toBe('hello');
    });

    test('escapes string with commas', () => {
        expect(csvEscape('hello, world')).toBe('"hello, world"');
    });

    test('escapes string with newlines', () => {
        expect(csvEscape('hello\nworld')).toBe('"hello\nworld"');
        expect(csvEscape('hello\rworld')).toBe('"hello\rworld"');
    });

    test('escapes string with quotes', () => {
        expect(csvEscape('hello "world"')).toBe('"hello ""world"""');
    });

    test('escapes string with leading/trailing spaces', () => {
        expect(csvEscape(' hello ')).toBe('" hello "');
    });
});

describe('toCsvString', () => {
    test('returns empty string for undefined or null', () => {
        expect(toCsvString(undefined)).toBe('');
        expect(toCsvString(null)).toBe('');
    });

    test('returns raw string for simple string input', () => {
        expect(toCsvString('hello')).toBe('hello');
    });

    test('parses JSON string and converts to CSV', () => {
        const json = JSON.stringify([{ a: 1, b: 2 }]);
        expect(toCsvString(json)).toBe('a,b\n1,2');
    });

    test('returns raw string if JSON parsing fails', () => {
        expect(toCsvString('{invalid json')).toBe('{invalid json');
    });

    test('handles array of primitives', () => {
        expect(toCsvString(['a', 'b', 'c'])).toBe('a\nb\nc');
    });

    test('handles array of objects', () => {
        const data = [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 }
        ];
        expect(toCsvString(data)).toBe('name,age\nAlice,30\nBob,25');
    });

    test('handles array of objects with missing keys', () => {
        const data = [
            { name: 'Alice', age: 30 },
            { name: 'Bob' }
        ];
        expect(toCsvString(data)).toBe('name,age\nAlice,30\nBob,');
    });

    test('handles array of objects with new keys in later rows', () => {
        const data = [
            { name: 'Alice' },
            { name: 'Bob', age: 25 }
        ];
        expect(toCsvString(data)).toBe('name,age\nAlice,\nBob,25');
    });

    test('handles empty array', () => {
        expect(toCsvString([])).toBe('');
    });

    test('handles nested arrays properly (using escape)', () => {
         // The implementation does:
         // if (Array.isArray(row)) return row.map(csvEscape).join(',');
         // return csvEscape(row);
         // So for array of arrays:
         const data = [['a', 'b'], ['c', 'd']];
         expect(toCsvString(data)).toBe('a,b\nc,d');
    });

    test('escapes values in CSV output', () => {
        const data = [
            { name: 'Alice, Bob', quote: 'She said "Hi"' }
        ];
        expect(toCsvString(data)).toBe('name,quote\n"Alice, Bob","She said ""Hi"""');
    });

});
