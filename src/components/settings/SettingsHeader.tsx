interface SettingsHeaderProps {
    tab: 'system' | 'data';
    onTabChange: (tab: 'system' | 'data') => void;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ tab, onTabChange }) => {
    return (
        <div className="flex items-end justify-between mb-8">
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.4em]">System</p>
                <h2 className="text-4xl font-bold tracking-tighter text-white">Settings</h2>
            </div>
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {(['system', 'data'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => onTabChange(t)}
                        className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${tab === t ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SettingsHeader;
