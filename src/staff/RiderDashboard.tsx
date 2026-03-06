import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Truck, CheckCircle2, RefreshCw, LogOut, Phone, MapPin, Navigation } from 'lucide-react';
import { fetchRiderDeliveries, fetchRiderStats, markDelivered, staffLogout } from '../admin/services/staffApi';

interface Delivery {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    customer: { name: string; phone: string };
    address: { line1: string; line2: string; city: string; region: string };
    itemCount: number;
}

interface RiderStats {
    pendingDelivery: number;
    deliveredToday: number;
    totalDelivered: number;
}

const RiderDashboard: React.FC = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [stats, setStats] = useState<RiderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const [deliveriesData, statsData] = await Promise.all([
                fetchRiderDeliveries(),
                fetchRiderStats(),
            ]);
            setDeliveries(deliveriesData);
            setStats(statsData);
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [load]);

    const handleDelivered = async (id: string) => {
        setActionLoading(id);
        try {
            await markDelivered(id);
            await load();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bone">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-green-800 text-bone px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Truck size={20} />
                    <div>
                        <h1 className="font-display text-lg uppercase tracking-tight">Deliveries</h1>
                        <p className="font-mono text-[11.5px] text-bone/40">WEARHSE Dispatch</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} className="p-2 rounded-full hover:bg-bone/10 transition-colors">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={staffLogout} className="p-2 rounded-full hover:bg-bone/10 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Stats */}
            {stats && (
                <div className="px-6 py-5 grid grid-cols-3 gap-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <p className="font-display text-2xl text-amber-700">{stats.pendingDelivery}</p>
                        <p className="font-mono text-[11.5px] text-amber-500 uppercase tracking-wider">To Deliver</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <p className="font-display text-2xl text-green-700">{stats.deliveredToday}</p>
                        <p className="font-mono text-[11.5px] text-green-500 uppercase tracking-wider">Today</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <p className="font-display text-2xl text-blue-700">{stats.totalDelivered}</p>
                        <p className="font-mono text-[11.5px] text-blue-500 uppercase tracking-wider">All Time</p>
                    </div>
                </div>
            )}

            <div className="px-6 pb-10 space-y-3">
                {deliveries.map(delivery => {
                    const fullAddress = [delivery.address.line1, delivery.address.line2, delivery.address.city, delivery.address.region]
                        .filter(Boolean)
                        .join(', ');
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                    const timeAgo = getTimeAgo(delivery.createdAt);

                    return (
                        <div key={delivery.id} className="bg-white border border-ink/8 rounded-xl overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-ink/5">
                                <div>
                                    <span className="font-mono text-sm font-medium">{delivery.orderNumber}</span>
                                    <span className="font-mono text-[11.5px] text-ink/35 ml-3">{timeAgo}</span>
                                </div>
                                <span className="font-mono text-[11.5px] text-ink/40">{delivery.itemCount} item{delivery.itemCount > 1 ? 's' : ''}</span>
                            </div>

                            {/* Customer & Address */}
                            <div className="px-4 py-3 space-y-3">
                                {/* Customer name & phone */}
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm font-medium">{delivery.customer.name}</span>
                                    {delivery.customer.phone && (
                                        <a href={`tel:${delivery.customer.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-mono text-[11.5px] font-medium hover:bg-green-100 transition-colors">
                                            <Phone size={12} />
                                            Call
                                        </a>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-ink/30 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-mono text-[13.5px] text-ink/60">{delivery.address.line1}</p>
                                        {delivery.address.line2 && (
                                            <p className="font-mono text-[13.5px] text-ink/40">{delivery.address.line2}</p>
                                        )}
                                        <p className="font-mono text-[13.5px] text-ink/50">
                                            {delivery.address.city}{delivery.address.region ? `, ${delivery.address.region}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Navigate button */}
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-blue-200 text-blue-600 font-mono text-[13.5px] uppercase tracking-wider hover:bg-blue-50 transition-colors"
                                >
                                    <Navigation size={14} />
                                    Open in Maps
                                </a>
                            </div>

                            {/* Mark delivered */}
                            <div className="px-4 py-3 border-t border-ink/5">
                                <button
                                    onClick={() => handleDelivered(delivery.id)}
                                    disabled={actionLoading === delivery.id}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-mono text-[13.5px] uppercase tracking-wider transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === delivery.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Mark as Delivered
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Empty state */}
                {deliveries.length === 0 && (
                    <div className="text-center py-16">
                        <Truck size={40} className="text-ink/10 mx-auto mb-4" />
                        <p className="font-mono text-sm text-ink/30">No deliveries pending</p>
                        <p className="font-mono text-[13.5px] text-ink/20 mt-1">Orders ready for delivery will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default RiderDashboard;
