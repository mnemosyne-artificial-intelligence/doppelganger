import { useState, useEffect } from 'react';
import { Trash2, Database, Image as ImageIcon } from 'lucide-react';

interface SettingsScreenProps {
    onClearStorage: (type: 'screenshots' | 'cookies') => void;
    onConfirm: (message: string) => Promise<boolean>;
    onNotify: (message: string, tone?: 'success' | 'error') => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    onClearStorage,
    onConfirm,
    onNotify
}) => {
    const [tab, setTab] = useState<'system' | 'data'>('system');
    const [screenshots, setScreenshots] = useState<{ name: string; url: string; size: number; modified: number }[]>([]);
    const [cookies, setCookies] = useState<{ name: string; value: string; domain?: string; path?: string; expires?: number }[]>([]);
    const [cookieOrigins, setCookieOrigins] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [expandedCookies, setExpandedCookies] = useState<Record<string, boolean>>({});

    const loadData = async () => {
        setDataLoading(true);
        try {
            const [shotsRes, cookiesRes] = await Promise.all([
                fetch('/api/data/screenshots'),
                fetch('/api/data/cookies')
            ]);
            const shotsData = shotsRes.ok ? await shotsRes.json() : { screenshots: [] };
            const cookiesData = cookiesRes.ok ? await cookiesRes.json() : { cookies: [], origins: [] };
            setScreenshots(Array.isArray(shotsData.screenshots) ? shotsData.screenshots : []);
            setCookies(Array.isArray(cookiesData.cookies) ? cookiesData.cookies : []);
            setCookieOrigins(Array.isArray(cookiesData.origins) ? cookiesData.origins : []);
        } catch {
            setScreenshots([]);
            setCookies([]);
            setCookieOrigins([]);
        } finally {
            setDataLoading(false);
        }
    };

    const deleteScreenshot = async (name: string) => {
        const confirmed = await onConfirm(`Delete screenshot ${name}?`);
        if (!confirmed) return;
        const res = await fetch(`/api/data/screenshots/${encodeURIComponent(name)}`, { method: 'DELETE' });
        if (res.ok) {
            onNotify('Screenshot deleted.', 'success');
            loadData();
        } else {
            onNotify('Delete failed.', 'error');
        }
    };

    const deleteCookie = async (cookie: { name: string; domain?: string; path?: string }) => {
        const confirmed = await onConfirm(`Delete cookie ${cookie.name}?`);
        if (!confirmed) return;
        const res = await fetch('/api/data/cookies/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: cookie.name, domain: cookie.domain, path: cookie.path })
        });
        if (res.ok) {
            onNotify('Cookie deleted.', 'success');
            loadData();
        } else {
            onNotify('Delete failed.', 'error');
        }
    };

    const cookieKey = (cookie: { name: string; domain?: string; path?: string; expires?: number }) => {
        return `${cookie.name}|${cookie.domain || ''}|${cookie.path || ''}|${cookie.expires || ''}`;
    };

    const toggleCookie = (cookie: { name: string; domain?: string; path?: string; expires?: number }) => {
        const key = cookieKey(cookie);
        setExpandedCookies((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        if (tab === 'data') loadData();
    }, [tab]);

    return (
        <main className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-end justify-between mb-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.4em]">System</p>
                        <h2 className="text-4xl font-bold tracking-tighter text-white">Settings</h2>
                    </div>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                        {(['system', 'data'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${tab === t ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === 'system' && (
                    <>
                        <div className="glass-card p-8 rounded-[40px] space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400"><Trash2 className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Storage</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Manage stored data</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => onClearStorage('screenshots')}
                                    className="flex-1 px-6 py-4 bg-red-500/5 border border-red-500/10 text-red-400 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all"
                                >
                                    Clear Screenshots
                                </button>
                                <button
                                    onClick={() => onClearStorage('cookies')}
                                    className="flex-1 px-6 py-4 bg-yellow-500/5 border border-yellow-500/10 text-yellow-400 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-yellow-500/10 transition-all"
                                >
                                    Reset Cookies
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {tab === 'data' && (
                    <>
                        <div className="glass-card p-8 rounded-[40px] space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400"><ImageIcon className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Screenshots</h3>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Stored captures</p>
                                    </div>
                                </div>
                                <button
                                    onClick={loadData}
                                    className="px-4 py-2 border border-white/10 text-[9px] font-bold rounded-xl uppercase tracking-widest text-white hover:bg-white/5 transition-all"
                                >
                                    Refresh
                                </button>
                            </div>
                            {dataLoading && <div className="text-[9px] text-gray-500 uppercase tracking-widest">Loading data...</div>}
                            {!dataLoading && screenshots.length === 0 && (
                                <div className="text-[9px] text-gray-600 uppercase tracking-widest">No screenshots found.</div>
                            )}
                            <div className="space-y-3">
                                {screenshots.map((shot) => (
                                    <div key={shot.name} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-black rounded-xl overflow-hidden shrink-0 border border-white/10">
                                            <img src={shot.url} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{shot.name}</div>
                                            <div className="text-[8px] text-gray-500 uppercase tracking-[0.2em]">
                                                {new Date(shot.modified).toLocaleString()} • {(shot.size / 1024).toFixed(1)} KB
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteScreenshot(shot.name)}
                                            className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

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
                                    onClick={() => onClearStorage('cookies')}
                                    className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                >
                                    Clear Cookies
                                </button>
                            </div>
                            {dataLoading && <div className="text-[9px] text-gray-500 uppercase tracking-widest">Loading data...</div>}
                            {!dataLoading && cookies.length === 0 && (
                                <div className="text-[9px] text-gray-600 uppercase tracking-widest">No cookies found.</div>
                            )}
                            <div className="space-y-3">
                                {cookies.map((cookie) => {
                                    const key = cookieKey(cookie);
                                    const isExpanded = !!expandedCookies[key];
                                    const value = cookie.value || '';
                                    const displayValue = isExpanded || value.length <= 120
                                        ? value
                                        : `${value.slice(0, 120)}…`;
                                    return (
                                        <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="text-[10px] font-bold text-white uppercase tracking-widest truncate">{cookie.name}</div>
                                                    <div className="text-[8px] text-gray-500 uppercase tracking-[0.2em]">
                                                        {(cookie.domain || 'local')} • {(cookie.path || '/')}
                                                        {cookie.expires ? ` • ${new Date(cookie.expires * 1000).toLocaleString()}` : ''}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteCookie(cookie)}
                                                    className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all"
                                                >
                                                    Delete
                                                </button>
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
                            {!dataLoading && cookieOrigins.length > 0 && (
                                <div className="pt-2 text-[8px] text-gray-600 uppercase tracking-widest">
                                    Origins stored: {cookieOrigins.length}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
};

export default SettingsScreen;
