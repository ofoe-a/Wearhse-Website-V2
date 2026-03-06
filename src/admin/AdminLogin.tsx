import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { login } from './services/adminApi';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bone flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-5">
                        <Lock size={20} className="text-ink/40" />
                    </div>
                    <h1 className="font-display text-2xl uppercase">WEARHSE</h1>
                    <p className="font-mono text-[13.5px] text-ink/40 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <p className="font-mono text-[13.5px] text-red-600">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                            placeholder="admin@wearhse.com"
                        />
                    </div>

                    <div>
                        <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full font-mono text-sm uppercase tracking-widest bg-ink text-bone hover:bg-ink/85 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
