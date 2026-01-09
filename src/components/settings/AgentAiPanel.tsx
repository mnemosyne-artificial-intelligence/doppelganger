import { useState, useEffect } from 'react';
import { Bot, Save, Eye, EyeOff } from 'lucide-react';

interface AgentAiPanelProps {
    apiKey: string | null;
    model: string;
    enabled: boolean;
    loading: boolean;
    saving: boolean;
    onSave: (next: { apiKey: string; model: string; enabled: boolean }) => void;
}

const AgentAiPanel: React.FC<AgentAiPanelProps> = ({ apiKey, model, enabled, loading, saving, onSave }) => {
    const [localKey, setLocalKey] = useState(apiKey || '');
    const [localModel, setLocalModel] = useState(model || 'gpt-5-nano');
    const [visible, setVisible] = useState(false);
    const [localEnabled, setLocalEnabled] = useState(enabled);

    useEffect(() => {
        setLocalKey(apiKey || '');
    }, [apiKey]);

    useEffect(() => {
        setLocalModel(model || 'gpt-5-nano');
    }, [model]);

    useEffect(() => {
        setLocalEnabled(enabled);
    }, [enabled]);

    const submit = () => {
        onSave({
            apiKey: localKey.trim(),
            model: localModel.trim() || 'gpt-5-nano',
            enabled: localEnabled
        });
    };

    return (
        <div className="glass-card p-8 rounded-[40px] space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400"><Bot className="w-5 h-5" /></div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Agent AI</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Bring your own OpenAI key</p>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">OpenAI API Key</label>
                <div className="flex items-center gap-3 rounded-2xl bg-black/40 border border-white/10 px-4 py-2">
                    <input
                        type={visible ? 'text' : 'password'}
                        value={loading ? 'Loading...' : localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        disabled={loading}
                        placeholder="sk-..."
                        className="flex-1 bg-transparent text-[10px] text-blue-200/80 font-mono focus:outline-none"
                    />
                    <button
                        onClick={() => setVisible((prev) => !prev)}
                        className="p-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        title={visible ? 'Hide key' : 'Show key'}
                        aria-label={visible ? 'Hide key' : 'Show key'}
                        type="button"
                    >
                        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Model</label>
                <input
                    type="text"
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    placeholder="gpt-5-nano"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2 text-[10px] text-white font-mono focus:outline-none focus:border-white/30 transition-all"
                />
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={localEnabled}
                        onChange={(e) => setLocalEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-transparent"
                    />
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white">Enable AI workflow generation</span>
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={submit}
                        disabled={saving || loading}
                        className="flex-1 px-6 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest bg-white text-black hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save AI Settings
                    </button>
                </div>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest">
                    Used by Agent Tasks to generate workflow blocks from steps.
                </p>
            </div>
        </div>
    );
};

export default AgentAiPanel;
