interface LoadingScreenProps {
    title?: string;
    subtitle?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ title = 'Loading', subtitle }) => {
    return (
        <div className="fixed inset-0 z-[80] bg-[#020202] flex items-center justify-center">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="glass-card p-10 rounded-[40px] text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">{title}</p>
                    {subtitle && (
                        <p className="text-xs font-mono text-white/80">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
