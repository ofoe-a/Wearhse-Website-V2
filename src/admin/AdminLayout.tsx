import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Users, LogOut, Menu, X, Truck } from 'lucide-react';
import { logout, getStoredUser } from './services/adminApi';

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true, color: 'text-blue-600 bg-blue-50' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', end: false, color: 'text-amber-600 bg-amber-50' },
    { to: '/admin/products', icon: Package, label: 'Products', end: false, color: 'text-purple-600 bg-purple-50' },
    { to: '/admin/shipping', icon: Truck, label: 'Shipping', end: false, color: 'text-teal-600 bg-teal-50' },
    { to: '/admin/team', icon: Users, label: 'Team', end: false, color: 'text-emerald-600 bg-emerald-50' },
];

const AdminLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = getStoredUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const NavContent = () => (
        <>
            {/* Brand */}
            <div className="px-5 py-6 border-b border-ink/8">
                <h2 className="font-display text-lg uppercase tracking-tight">WEARHSE</h2>
                <p className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35 mt-0.5">Admin</p>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm transition-all duration-200 ${
                                isActive
                                    ? `${item.color} font-medium`
                                    : 'text-ink/45 hover:text-ink hover:bg-ink/[0.03]'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div className="px-3 py-4 border-t border-ink/8">
                {user && (
                    <div className="px-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink/10 to-ink/5 flex items-center justify-center shrink-0">
                                <span className="font-mono text-[13.5px] font-medium text-ink/50">
                                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="font-mono text-[13.5px] font-medium truncate">{user.firstName || user.email.split('@')[0]}</p>
                                <p className="font-mono text-[11.5px] text-ink/30 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm text-ink/35 hover:text-red-500 hover:bg-red-50 transition-colors w-full"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-bone flex">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 border-r border-ink/8 bg-bone fixed inset-y-0 left-0 z-30">
                <NavContent />
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-ink/20" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-bone flex flex-col shadow-xl">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-4 right-4 p-1 text-ink/40 hover:text-ink"
                        >
                            <X size={20} />
                        </button>
                        <NavContent />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 md:ml-56 lg:ml-64 min-h-screen">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-ink/8 sticky top-0 bg-bone z-20">
                    <button onClick={() => setSidebarOpen(true)} className="p-1.5">
                        <Menu size={20} />
                    </button>
                    <span className="font-display text-sm uppercase">WEARHSE</span>
                    <div className="w-8" />
                </header>

                {/* Page content */}
                <main className="p-5 md:p-8 lg:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
