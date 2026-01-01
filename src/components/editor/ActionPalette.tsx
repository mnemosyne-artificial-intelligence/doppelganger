import { X } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Action } from '../../types';
import { ACTION_CATALOG } from './actionCatalog';

interface ActionPaletteProps {
    open: boolean;
    query: string;
    onQueryChange: (value: string) => void;
    onClose: () => void;
    onSelect: (type: Action['type']) => void;
}

const ActionPalette: React.FC<ActionPaletteProps> = ({ open, query, onQueryChange, onClose, onSelect }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ACTION_CATALOG;
        return ACTION_CATALOG.filter((item) =>
            item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
    }, [query]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[190] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            onClick={onClose}
        >
            <div
                className="glass-card w-full max-w-xl rounded-[28px] border border-white/10 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500">Add Block</p>
                        <p className="text-xs text-gray-400 mt-1">Search actions and control flow blocks.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <input
                    ref={(node) => {
                        inputRef.current = node;
                        if (node) node.focus();
                    }}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Type to filter (e.g., if, click, loop)"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
                />
                <div className="mt-4 max-h-[320px] overflow-y-auto custom-scrollbar space-y-2">
                    {filtered.map((item) => (
                        <button
                            key={item.type}
                            onClick={() => onSelect(item.type)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all"
                        >
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white">{item.label}</div>
                            <div className="text-[9px] text-gray-500 mt-1">{item.description}</div>
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-[9px] text-gray-600 uppercase tracking-widest">No matches.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActionPalette;
