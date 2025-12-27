import { useState } from 'react';

interface AuthScreenProps {
    status: 'login' | 'setup';
    onSubmit: (email: string, pass: string, name?: string, passConfirm?: string) => Promise<void>;
    error: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ status, onSubmit, error }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [passConfirm, setPassConfirm] = useState('');

    const handleSubmit = () => {
        onSubmit(email, pass, name, passConfirm);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="w-[400px] glass-card p-10 rounded-[48px] space-y-8 relative">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tighter text-white uppercase italic">Doppelgänger</h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
                        {status === 'setup' ? 'Initializing System' : 'Access Restricted'}
                    </p>
                </div>

                <div className="space-y-4">
                    {status === 'setup' && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full Name"
                                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Password</label>
                        <input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                        />
                    </div>
                    {status === 'setup' && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Confirm Password</label>
                            <input
                                type="password"
                                value={passConfirm}
                                onChange={(e) => setPassConfirm(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
                            />
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    className="shine-effect w-full bg-white text-black py-4 rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {status === 'setup' ? 'Create Account' : 'Authenticate'}
                </button>

                {error && (
                    <div className="text-[9px] font-bold text-red-500 text-center uppercase tracking-widest">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
