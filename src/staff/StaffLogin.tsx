import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { staffLogin } from '../admin/services/staffApi';

const StaffLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await staffLogin(email, password);
            // Route based on role
            if (data.user.role === 'printer') {
                navigate('/staff/printer');
            } else if (data.user.role === 'rider') {
                navigate('/staff/rider');
            } else if (data.user.role === 'admin') {
                navigate('/admin');
            }
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
                    <h1 className="font-display text-3xl uppercase tracking-tight mb-2">WEARHSE</h1>
                    <p className="font-mono text-[13.5px] text-ink/40">Staff Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <p className="font-mono text-[13.5px] text-red-600">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="font-mono text-[11.5px] text-ink/50 uppercase tracking-wider block mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-ink/15 rounded-lg font-mono text-sm bg-white/50 focus:outline-none focus:border-ink/40 transition-colors"
                            placeholder="you@wearhse.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="font-mono text-[11.5px] text-ink/50 uppercase tracking-wider block mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-ink/15 rounded-lg font-mono text-sm bg-white/50 focus:outline-none focus:border-ink/40 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-ink text-bone font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-ink/85 transition-colors"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StaffLogin;
