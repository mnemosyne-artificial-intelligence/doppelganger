interface LayoutPanelProps {
    splitPercent: number;
    onChange: (value: number) => void;
    onReset: () => void;
}

const LayoutPanel: React.FC<LayoutPanelProps> = ({ splitPercent, onChange, onReset }) => {
    const safeSplit = Number.isFinite(splitPercent) ? Math.min(75, Math.max(25, splitPercent)) : 30;
    return (
        <div className="glass-card p-8 rounded-[40px] space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Layout</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Default editor split</p>
                </div>
                <button
                    onClick={onReset}
                    className="px-4 py-2 border border-white/10 text-[9px] font-bold rounded-xl uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                    Reset 30/70
                </button>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span>Editor</span>
                    <span>{safeSplit}%</span>
                </div>
                <input
                    type="range"
                    min={25}
                    max={75}
                    step={5}
                    value={safeSplit}
                    onChange={(e) => onChange(Math.min(75, Math.max(25, Number(e.target.value))))}
                    className="w-full accent-white"
                />
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span>Preview</span>
                    <span>{100 - safeSplit}%</span>
                </div>
            </div>
        </div>
    );
};

export default LayoutPanel;
