import { Trash2 } from 'lucide-react';

interface StoragePanelProps {
    onClearStorage: (type: 'screenshots' | 'cookies') => void;
}

const StoragePanel: React.FC<StoragePanelProps> = ({ onClearStorage }) => {
    return (
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
    );
};

export default StoragePanel;
