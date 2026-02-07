const { normalizeIp } = require('../lib/ip');

describe('normalizeIp', () => {
    test('returns empty string for falsy input', () => {
        expect(normalizeIp(null)).toBe('');
        expect(normalizeIp(undefined)).toBe('');
        expect(normalizeIp('')).toBe('');
    });

    test('trims whitespace', () => {
        expect(normalizeIp('  127.0.0.1  ')).toBe('127.0.0.1');
    });

    test('takes the first IP from a comma-separated list', () => {
        expect(normalizeIp('127.0.0.1, 192.168.0.1')).toBe('127.0.0.1');
        expect(normalizeIp('  127.0.0.1 , 192.168.0.1')).toBe('127.0.0.1');
    });

    test('removes ::ffff: prefix', () => {
        expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
    });

    test('removes brackets from IPv6', () => {
        expect(normalizeIp('[::1]')).toBe('::1');
    });

    test('removes zone index (percentage sign)', () => {
        expect(normalizeIp('fe80::1%eth0')).toBe('fe80::1');
        expect(normalizeIp('fe80::1%12')).toBe('fe80::1');
    });

    test('handles standard IPv4', () => {
        expect(normalizeIp('192.168.1.1')).toBe('192.168.1.1');
    });

    test('handles standard IPv6', () => {
        expect(normalizeIp('2001:db8::1')).toBe('2001:db8::1');
    });

    test('handles ::ffff: prefix inside brackets (current behavior)', () => {
        // The current implementation checks for ::ffff: before removing brackets.
        // So [::ffff:127.0.0.1] -> ::ffff:127.0.0.1 (brackets removed, prefix kept)
        expect(normalizeIp('[::ffff:127.0.0.1]')).toBe('::ffff:127.0.0.1');
    });
});
