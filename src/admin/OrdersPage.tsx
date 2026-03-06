import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchOrders } from './services/adminApi';
import StatusBadge from './components/StatusBadge';

const tabs = ['all', 'pending', 'confirmed', 'processing', 'printed', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled'];

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    customer: string;
    itemCount: number;
    createdAt: string;
}

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchOrders({ status: activeTab, search, page });
            setOrders(data.orders);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, page]);

    useEffect(() => { load(); }, [load]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        load();
    };

    return (
        <div>
            <h1 className="font-display text-2xl uppercase mb-8">Orders</h1>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Status tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setPage(1); }}
                            className={`px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                                activeTab === tab
                                    ? 'bg-ink text-bone'
                                    : 'text-ink/40 hover:text-ink hover:bg-ink/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search orders..."
                        className="w-full sm:w-48 bg-transparent border border-ink/10 rounded-lg pl-9 pr-3 py-2 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/25"
                    />
                </form>
            </div>

            {/* Table */}
            <div className="border border-ink/8 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 size={20} className="animate-spin text-ink/30" />
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-center py-16 font-mono text-sm text-ink/30">No orders found</p>
                ) : (
                    <>
                        {/* Header — desktop only */}
                        <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.5fr_0.7fr_0.7fr_0.8fr] gap-4 px-5 py-3 border-b border-ink/8 bg-ink/[0.02]">
                            {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                                <span key={h} className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">{h}</span>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-ink/8">
                            {orders.map(order => (
                                <Link
                                    key={order.id}
                                    to={`/admin/orders/${order.id}`}
                                    className="block px-5 py-4 hover:bg-ink/[0.02] transition-colors"
                                >
                                    {/* Mobile layout */}
                                    <div className="md:hidden">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-[13.5px] text-ink/40 truncate">{order.customer}</span>
                                            <span className="font-mono text-sm">GHS {order.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Desktop layout */}
                                    <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.5fr_0.7fr_0.7fr_0.8fr] gap-4 items-center">
                                        <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                        <span className="font-mono text-[13.5px] text-ink/50 truncate">{order.customer}</span>
                                        <span className="font-mono text-[13.5px] text-ink/40">{order.itemCount}</span>
                                        <span className="font-mono text-sm">GHS {order.total.toFixed(2)}</span>
                                        <StatusBadge status={order.status} />
                                        <span className="font-mono text-[13.5px] text-ink/40">
                                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-ink/5 disabled:opacity-20 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono text-[13.5px] text-ink/40">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg hover:bg-ink/5 disabled:opacity-20 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
