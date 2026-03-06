import React, { useEffect, useState } from 'react';
import { Loader2, UserPlus, Shield, ShieldOff, Users, Printer, Truck } from 'lucide-react';
import { fetchTeam, inviteTeamMember, updateTeamRole, getStoredUser } from './services/adminApi';

interface TeamMember {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    createdAt: string;
}

const TeamPage: React.FC = () => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviteFirst, setInviteFirst] = useState('');
    const [inviteLast, setInviteLast] = useState('');
    const [inviteRole, setInviteRole] = useState('admin');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');

    const currentUser = getStoredUser();

    const loadTeam = () => {
        fetchTeam().then(setTeam).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { loadTeam(); }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInviting(true);
        try {
            await inviteTeamMember({
                email: inviteEmail,
                password: invitePassword,
                firstName: inviteFirst || undefined,
                lastName: inviteLast || undefined,
                role: inviteRole,
            });
            setShowInvite(false);
            setInviteEmail('');
            setInvitePassword('');
            setInviteFirst('');
            setInviteLast('');
            loadTeam();
        } catch (err: any) {
            setError(err.message || 'Failed to invite');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm('Remove admin access for this user?')) return;
        try {
            await updateTeamRole(id, 'customer');
            loadTeam();
        } catch (err: any) {
            alert(err.message || 'Failed to update role');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-display text-2xl uppercase">Team</h1>
                <button
                    onClick={() => setShowInvite(!showInvite)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider bg-ink text-bone hover:bg-ink/85 transition-colors"
                >
                    <UserPlus size={14} />
                    Add Member
                </button>
            </div>

            {/* Invite form */}
            {showInvite && (
                <div className="border border-ink/8 rounded-xl p-5 mb-6">
                    <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35 mb-4">Invite Team Member</h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
                            <p className="font-mono text-[13.5px] text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    required
                                    className="w-full bg-transparent border-b border-ink/15 py-2 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                                    placeholder="team@wearhse.com"
                                />
                            </div>
                            <div>
                                <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={invitePassword}
                                    onChange={e => setInvitePassword(e.target.value)}
                                    required
                                    className="w-full bg-transparent border-b border-ink/15 py-2 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-1.5">First Name</label>
                                <input
                                    value={inviteFirst}
                                    onChange={e => setInviteFirst(e.target.value)}
                                    className="w-full bg-transparent border-b border-ink/15 py-2 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-1.5">Last Name</label>
                                <input
                                    value={inviteLast}
                                    onChange={e => setInviteLast(e.target.value)}
                                    className="w-full bg-transparent border-b border-ink/15 py-2 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Role</label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'admin', label: 'Admin', desc: 'Full access' },
                                    { value: 'printer', label: 'Printer', desc: 'Print queue only' },
                                    { value: 'rider', label: 'Rider', desc: 'Deliveries only' },
                                ].map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setInviteRole(r.value)}
                                        className={`flex-1 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                                            inviteRole === r.value
                                                ? 'border-ink bg-ink/5'
                                                : 'border-ink/10 hover:border-ink/25'
                                        }`}
                                    >
                                        <span className="font-mono text-[13.5px] font-medium block">{r.label}</span>
                                        <span className="font-mono text-[10px] text-ink/40">{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={inviting}
                                className="px-5 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider bg-ink text-bone hover:bg-ink/85 disabled:opacity-50 transition-colors"
                            >
                                {inviting ? 'Inviting...' : 'Send Invite'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowInvite(false)}
                                className="px-5 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider border border-ink/10 hover:bg-ink/5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Team list */}
            <div className="border border-ink/8 rounded-xl overflow-hidden">
                {team.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users size={32} className="mx-auto text-ink/15 mb-4" />
                        <p className="font-mono text-sm text-ink/30">No team members yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-ink/8">
                        {team.map(member => (
                            <div key={member.id} className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                                        <Shield size={16} className="text-ink/30" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono text-sm font-medium truncate">
                                            {member.firstName && member.lastName
                                                ? `${member.firstName} ${member.lastName}`
                                                : member.email}
                                        </p>
                                        <p className="font-mono text-[13.5px] text-ink/40 truncate">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider ${
                                        member.role === 'admin' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                        member.role === 'printer' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                                        member.role === 'rider' ? 'bg-green-50 text-green-600 border border-green-200' :
                                        'bg-ink/5 text-ink/40 border border-ink/10'
                                    }`}>
                                        {member.role === 'printer' && <Printer size={10} />}
                                        {member.role === 'rider' && <Truck size={10} />}
                                        {member.role === 'admin' && <Shield size={10} />}
                                        {member.id === currentUser?.id ? 'You' : member.role}
                                    </span>
                                    {member.id !== currentUser?.id && (
                                        <button
                                            onClick={() => handleRemove(member.id)}
                                            className="p-1.5 text-ink/20 hover:text-red-500 transition-colors"
                                            title="Remove admin access"
                                        >
                                            <ShieldOff size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamPage;
