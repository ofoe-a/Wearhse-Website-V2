import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, Clock, AlertTriangle, Loader2, ChevronRight, TrendingUp, Package, Truck, CheckCircle2, ArrowRight, UserPlus } from 'lucide-react';
import { fetchDashboard, fetchReadyForPickup } from './services/adminApi';
import StatusBadge from './components/StatusBadge';
import RiderAssignModal from './components/RiderAssignModal';

interface DashboardData {
    stats: {
        totalOrders: number;
        revenue: number;
        pendingOrders: number;
        lowStockItems: number;
        processingOrders: number;
        confirmedOrders: number;
        shippedOrders: number;
        deliveredOrders: number;
        todayOrders: number;
        todayRevenue: number;
        readyForPickup: number;
    };
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        total: number;
        customer: string;
        createdAt: string;
    }>;
    needsAttention: Array<{
        id: string;
        orderNumber: string;
        status: string;
        total: number;
        customer: string;
        city: string;
        createdAt: string;
    }>;
}

interface ReadyOrder {
    id: string;
    orderNumber: string;
    customer: string;
    phone: string;
    city: string;
    region: string;
    itemCount: number;
    createdAt: string;
}

const Dashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
    const [assignModal, setAssignModal] = useState<{ open: boolean; order: ReadyOrder | null }>({ open: false, order: null });

    const loadData = () => {
        Promise.all([fetchDashboard(), fetchReadyForPickup()])
            .then(([dash, ready]) => { setData(dash); setReadyOrders(ready); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    if (!data) return null;

    const { stats } = data;

    return (
        <div>
            {/* Header with today's summary */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="font-display text-2xl uppercase">Dashboard</h1>
                    <p className="font-mono text-[13.5px] text-ink/40 mt-1">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                {stats.todayOrders > 0 && (
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="font-mono text-[13.5px] text-emerald-700">
                            {stats.todayOrders} order{stats.todayOrders !== 1 ? 's' : ''} today · GHS {stats.todayRevenue.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>

            {/* Main stats — colorful cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <ShoppingBag size={14} className="text-blue-600" />
                        </div>
                        <span className="font-mono text-[11.5px] uppercase tracking-widest text-blue-600/60">Orders</span>
                    </div>
                    <p className="font-mono text-2xl font-medium text-blue-900">{stats.totalOrders}</p>
                </div>

                <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign size={14} className="text-emerald-600" />
                        </div>
                        <span className="font-mono text-[11.5px] uppercase tracking-widest text-emerald-600/60">Revenue</span>
                    </div>
                    <p className="font-mono text-2xl font-medium text-emerald-900">
                        GHS {stats.revenue.toLocaleString('en', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock size={14} className="text-amber-600" />
                        </div>
                        <span className="font-mono text-[11.5px] uppercase tracking-widest text-amber-600/60">Pending</span>
                    </div>
                    <p className="font-mono text-2xl font-medium text-amber-900">{stats.pendingOrders}</p>
                </div>

                <div className={`rounded-xl p-5 border ${
                    stats.lowStockItems > 0
                        ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
                }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            stats.lowStockItems > 0 ? 'bg-red-500/10' : 'bg-gray-500/10'
                        }`}>
                            <AlertTriangle size={14} className={stats.lowStockItems > 0 ? 'text-red-600' : 'text-gray-400'} />
                        </div>
                        <span className={`font-mono text-[11.5px] uppercase tracking-widest ${
                            stats.lowStockItems > 0 ? 'text-red-600/60' : 'text-gray-400'
                        }`}>Low Stock</span>
                    </div>
                    <p className={`font-mono text-2xl font-medium ${
                        stats.lowStockItems > 0 ? 'text-red-900' : 'text-gray-400'
                    }`}>{stats.lowStockItems}</p>
                </div>
            </div>

            {/* Order pipeline */}
            <div className="border border-ink/8 rounded-xl p-5 mb-8">
                <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35 mb-4">Order Pipeline</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Link to="/admin/orders?status=confirmed" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="font-mono text-lg font-medium text-blue-800">{stats.confirmedOrders}</p>
                            <p className="font-mono text-[11.5px] uppercase tracking-wider text-blue-500">Confirmed</p>
                        </div>
                    </Link>

                    <Link to="/admin/orders?status=processing" className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 hover:bg-purple-50 border border-purple-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Package size={16} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="font-mono text-lg font-medium text-purple-800">{stats.processingOrders}</p>
                            <p className="font-mono text-[11.5px] uppercase tracking-wider text-purple-500">Processing</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <UserPlus size={16} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="font-mono text-lg font-medium text-orange-800">{stats.readyForPickup}</p>
                            <p className="font-mono text-[11.5px] uppercase tracking-wider text-orange-500">Awaiting Rider</p>
                        </div>
                    </div>

                    <Link to="/admin/orders?status=shipped" className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <Truck size={16} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-mono text-lg font-medium text-indigo-800">{stats.shippedOrders}</p>
                            <p className="font-mono text-[11.5px] uppercase tracking-wider text-indigo-500">Shipped</p>
                        </div>
                    </Link>

                    <Link to="/admin/orders?status=delivered" className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-mono text-lg font-medium text-emerald-800">{stats.deliveredOrders}</p>
                            <p className="font-mono text-[11.5px] uppercase tracking-wider text-emerald-500">Delivered</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Ready for Pickup — Assign Rider */}
            {readyOrders.length > 0 && (
                <div className="border border-orange-200/60 bg-orange-50/30 rounded-xl overflow-hidden mb-8">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-orange-200/40">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                            <h2 className="font-mono text-[13.5px] uppercase tracking-widest text-orange-700/70">Ready for Pickup — Assign Rider</h2>
                        </div>
                        <span className="font-mono text-[11.5px] text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                            {readyOrders.length}
                        </span>
                    </div>
                    <div className="divide-y divide-orange-200/30">
                        {readyOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                        <span className="font-mono text-[11px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                                            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <p className="font-mono text-[11.5px] text-ink/35 truncate">
                                        {order.customer} &bull; {order.city}{order.region ? `, ${order.region}` : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAssignModal({ open: true, order })}
                                    className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-[#f4f4f0] rounded-lg font-mono text-[12px] hover:bg-[#1a1a1a]/90 transition-colors"
                                >
                                    <UserPlus size={13} />
                                    Assign Rider
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Needs attention */}
                <div className="border border-amber-200/60 bg-amber-50/30 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200/40">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <h2 className="font-mono text-[13.5px] uppercase tracking-widest text-amber-700/70">Needs Attention</h2>
                        </div>
                        <span className="font-mono text-[11.5px] text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">
                            {data.needsAttention.length}
                        </span>
                    </div>

                    {data.needsAttention.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2" />
                            <p className="font-mono text-[13.5px] text-ink/30">All caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-amber-200/30">
                            {data.needsAttention.slice(0, 5).map(order => (
                                <Link
                                    key={order.id}
                                    to={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-amber-50/50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <p className="font-mono text-[11.5px] text-ink/35 truncate">
                                            {order.customer}{order.city ? ` · ${order.city}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 shrink-0">
                                        <span className="font-mono text-[13.5px] font-medium">GHS {order.total.toFixed(2)}</span>
                                        <ArrowRight size={12} className="text-ink/20" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent orders */}
                <div className="border border-ink/8 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8">
                        <h2 className="font-mono text-[13.5px] uppercase tracking-widest text-ink/50">Recent Orders</h2>
                        <Link to="/admin/orders" className="font-mono text-[13.5px] text-ink/40 hover:text-ink flex items-center gap-1 transition-colors">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>

                    {data.recentOrders.length === 0 ? (
                        <p className="px-5 py-10 text-center font-mono text-sm text-ink/30">No orders yet</p>
                    ) : (
                        <div className="divide-y divide-ink/8">
                            {data.recentOrders.slice(0, 6).map(order => (
                                <Link
                                    key={order.id}
                                    to={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-ink/[0.02] transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <p className="font-mono text-[11.5px] text-ink/35 truncate">{order.customer}</p>
                                    </div>
                                    <div className="text-right ml-3 shrink-0">
                                        <p className="font-mono text-[13.5px] font-medium">GHS {order.total.toFixed(2)}</p>
                                        <p className="font-mono text-[11.5px] text-ink/25">
                                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Rider Assignment Modal */}
            {assignModal.order && (
                <RiderAssignModal
                    isOpen={assignModal.open}
                    orderId={assignModal.order.id}
                    orderNumber={assignModal.order.orderNumber}
                    customer={assignModal.order.customer}
                    city={assignModal.order.city}
                    onClose={() => setAssignModal({ open: false, order: null })}
                    onAssigned={loadData}
                />
            )}
        </div>
    );
};

export default Dashboard;
