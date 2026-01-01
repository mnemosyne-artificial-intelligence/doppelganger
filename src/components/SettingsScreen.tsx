import { useState, useEffect } from 'react';
import { ConfirmRequest } from '../types';
import ApiKeyPanel from './settings/ApiKeyPanel';
import StoragePanel from './settings/StoragePanel';
import ScreenshotsPanel from './settings/ScreenshotsPanel';
import CookiesPanel from './settings/CookiesPanel';
import SettingsHeader from './settings/SettingsHeader';
import LayoutPanel from './settings/LayoutPanel';

interface SettingsScreenProps {
    onClearStorage: (type: 'screenshots' | 'cookies') => void;
    onConfirm: (request: string | ConfirmRequest) => Promise<boolean>;
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
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [apiKeyLoading, setApiKeyLoading] = useState(false);
    const [apiKeySaving, setApiKeySaving] = useState(false);
    const [layoutSplitPercent, setLayoutSplitPercent] = useState(30);

    const layoutStorageKey = 'doppelganger.layout.leftWidthPct';

    useEffect(() => {
        try {
            const stored = localStorage.getItem(layoutStorageKey);
            if (stored) {
                const value = Math.min(75, Math.max(25, Math.round(parseFloat(stored) * 100)));
                if (!Number.isNaN(value)) setLayoutSplitPercent(value);
            }
        } catch {
            // ignore
        }
    }, []);

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

    const loadApiKey = async () => {
        setApiKeyLoading(true);
        try {
            const res = await fetch('/api/settings/api-key', { credentials: 'include' });
            if (!res.ok) {
                if (res.status === 401) {
                    onNotify('Session expired. Please log in again.', 'error');
                }
                setApiKey(null);
                return;
            }
            const data = await res.json();
            setApiKey(data.apiKey || null);
        } catch {
            setApiKey(null);
        } finally {
            setApiKeyLoading(false);
        }
    };

    const regenerateApiKey = async () => {
        setApiKeySaving(true);
        try {
            const res = await fetch('/api/settings/api-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!res.ok) {
                let detail = '';
                try {
                    const data = await res.json();
                    detail = data?.error || data?.message || '';
                } catch {
                    detail = '';
                }
                if (res.status === 401) {
                    onNotify('Session expired. Please log in again.', 'error');
                } else {
                    onNotify(`Failed to generate API key${detail ? `: ${detail}` : ''}.`, 'error');
                }
                return;
            }
            const data = await res.json();
            setApiKey(data.apiKey || null);
            onNotify('API key generated.', 'success');
        } catch {
            onNotify('Failed to generate API key.', 'error');
        } finally {
            setApiKeySaving(false);
        }
    };

    const copyApiKey = async () => {
        if (!apiKey) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(apiKey);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = apiKey;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (!ok) throw new Error('Copy failed');
            }
            onNotify('API key copied.', 'success');
        } catch {
            onNotify('Copy failed.', 'error');
        }
    };

    useEffect(() => {
        if (tab === 'data') loadData();
        if (tab === 'system') loadApiKey();
    }, [tab]);

    useEffect(() => {
        try {
            localStorage.setItem(layoutStorageKey, String(layoutSplitPercent / 100));
        } catch {
            // ignore
        }
    }, [layoutSplitPercent]);

    return (
        <main className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
            <div className="max-w-3xl mx-auto space-y-8">
                <SettingsHeader tab={tab} onTabChange={setTab} />

                {tab === 'system' && (
                    <>
                        <ApiKeyPanel
                            apiKey={apiKey}
                            loading={apiKeyLoading}
                            saving={apiKeySaving}
                            onRegenerate={regenerateApiKey}
                            onCopy={copyApiKey}
                        />
                        <LayoutPanel
                            splitPercent={layoutSplitPercent}
                            onChange={setLayoutSplitPercent}
                            onReset={() => setLayoutSplitPercent(30)}
                        />
                        <StoragePanel onClearStorage={onClearStorage} />
                    </>
                )}

                {tab === 'data' && (
                    <>
                        <ScreenshotsPanel
                            screenshots={screenshots}
                            loading={dataLoading}
                            onRefresh={loadData}
                            onDelete={deleteScreenshot}
                        />

                        <CookiesPanel
                            cookies={cookies}
                            originsCount={cookieOrigins.length}
                            loading={dataLoading}
                            onClear={() => onClearStorage('cookies')}
                            onDelete={deleteCookie}
                        />
                    </>
                )}
            </div>
        </main>
    );
};

export default SettingsScreen;
