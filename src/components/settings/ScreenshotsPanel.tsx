import { Image as ImageIcon } from 'lucide-react';

interface ScreenshotEntry {
    name: string;
    url: string;
    size: number;
    modified: number;
}

interface ScreenshotsPanelProps {
    screenshots: ScreenshotEntry[];
    loading: boolean;
    onRefresh: () => void;
    onDelete: (name: string) => void;
}

const ScreenshotsPanel: React.FC<ScreenshotsPanelProps> = ({ screenshots, loading, onRefresh, onDelete }) => {
    return (
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
                    onClick={onRefresh}
                    className="px-4 py-2 border border-white/10 text-[9px] font-bold rounded-xl uppercase tracking-widest text-white hover:bg-white/5 transition-all"
                >
                    Refresh
                </button>
            </div>
            {loading && <div className="text-[9px] text-gray-500 uppercase tracking-widest">Loading data...</div>}
            {!loading && screenshots.length === 0 && (
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
                                {new Date(shot.modified).toLocaleString()} | {(shot.size / 1024).toFixed(1)} KB
                            </div>
                        </div>
                        <button
                            onClick={() => onDelete(shot.name)}
                            className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScreenshotsPanel;
