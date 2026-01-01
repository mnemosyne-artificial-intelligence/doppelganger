import { useState } from 'react';
import { Database } from 'lucide-react';

interface CookieEntry {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
}

interface CookiesPanelProps {
    cookies: CookieEntry[];
    originsCount: number;
    loading: boolean;
    onClear: () => void;
    onDelete: (cookie: { name: string; domain?: string; path?: string }) => void;
}

const CookiesPanel: React.FC<CookiesPanelProps> = ({ cookies, originsCount, loading, onClear, onDelete }) => {
    const [expandedCookies, setExpandedCookies] = useState<Record<string, boolean>>({});
    const [decodedCookies, setDecodedCookies] = useState<Record<string, boolean>>({});

    const cookieKey = (cookie: CookieEntry) => {
        return `${cookie.name}|${cookie.domain || ''}|${cookie.path || ''}|${cookie.expires || ''}`;
    };

    const isMostlyPrintable = (value: string) => {
        if (!value) return false;
        let printable = 0;
        for (let i = 0; i < value.length; i += 1) {
            const code = value.charCodeAt(i);
            if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)) {
                printable += 1;
            }
        }
        return printable / value.length >= 0.85;
    };

    const decodeCookieValue = (value: string) => {
        if (!value) return null;
        if (/%[0-9A-Fa-f]{2}/.test(value)) {
            try {
                const decoded = decodeURIComponent(value);
                if (decoded !== value && isMostlyPrintable(decoded)) {
                    return { value: decoded, kind: 'URL' as const };
                }
            } catch {
                // Ignore invalid URI sequences
            }
        }
        if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length >= 12 && value.length % 4 === 0) {
            try {
                const decoded = atob(value);
                if (decoded && isMostlyPrintable(decoded)) {
                    return { value: decoded, kind: 'Base64' as const };
                }
            } catch {
                // Ignore invalid base64
            }
        }
        return null;
    };

    const toggleCookie = (cookie: CookieEntry) => {
        const key = cookieKey(cookie);
        setExpandedCookies((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleDecodedCookie = (cookie: CookieEntry) => {
        const key = cookieKey(cookie);
        setDecodedCookies((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="glass-card p-8 rounded-[40px] space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400"><Database className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Cookies</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Browser storage state</p>
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-400 hover:bg-yellow-500/10 transition-all"
                >
                    Clear Cookies
                </button>
            </div>
            {loading && <div className="text-[9px] text-gray-500 uppercase tracking-widest">Loading data...</div>}
            {!loading && cookies.length === 0 && (
                <div className="text-[9px] text-gray-600 uppercase tracking-widest">No cookies found.</div>
            )}
            <div className="space-y-3">
                {cookies.map((cookie) => {
                    const key = cookieKey(cookie);
                    const isExpanded = !!expandedCookies[key];
                    const value = cookie.value || '';
                    const decodedCandidate = decodeCookieValue(value);
                    const showDecoded = !!decodedCandidate && !!decodedCookies[key];
                    const fullValue = showDecoded && decodedCandidate ? decodedCandidate.value : value;
                    const displayValue = isExpanded || fullValue.length <= 120
                        ? fullValue
                        : `${fullValue.slice(0, 120)}...`;
                    return (
                        <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{cookie.name}</div>
                                    <div className="text-[8px] text-gray-500 uppercase tracking-[0.2em]">
                                        {(cookie.domain || 'local')} | {(cookie.path || '/')}
                                        {cookie.expires ? ` | ${new Date(cookie.expires * 1000).toLocaleString()}` : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {decodedCandidate && (
                                        <button
                                            onClick={() => toggleDecodedCookie(cookie)}
                                            className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            {showDecoded ? 'Show Raw' : `Decode ${decodedCandidate.kind}`}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(cookie)}
                                        className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div
                                onClick={() => toggleCookie(cookie)}
                                className="cursor-pointer rounded-xl bg-black/40 border border-white/10 px-3 py-2 font-mono text-[10px] text-blue-200/80 whitespace-pre-wrap break-words"
                                title="Click to expand/collapse"
                            >
                                {displayValue || '(empty)'}
                            </div>
                        </div>
                    );
                })}
            </div>
            {!loading && originsCount > 0 && (
                <div className="pt-2 text-[8px] text-gray-600 uppercase tracking-widest">
                    Origins stored: {originsCount}
                </div>
            )}
        </div>
    );
};

export default CookiesPanel;
