import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Printer, PlayCircle, CheckCircle2, RefreshCw, LogOut, Undo2, Package, Truck, Bell, BellOff, X, Check } from 'lucide-react';
import {
    fetchPrinterQueue,
    fetchPrinterStats,
    startPrinting,
    donePrinting,
    undoPrinting,
    batchDispatch,
    staffLogout,
} from '../admin/services/staffApi';

interface PrintItem {
    productName: string;
    colorName: string;
    size: string;
    quantity: number;
}

interface PrintOrder {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    items: PrintItem[];
}

interface PrinterStats {
    awaitingPrint: number;
    inProgress: number;
    printed: number;
    todayNew: number;
    dispatchedToday: number;
}

// Tiny embedded notification sound (short beep)
const BEEP_AUDIO = 'data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTIAAABkZHR0hISUlKSkpKSkpKSUlISEdHRkZFRURERERERUVGRk';

const playNotificationSound = () => {
    try {
        const audio = new Audio(BEEP_AUDIO);
        audio.volume = 0.5;
        audio.play().catch(() => { /* user hasn't interacted yet */ });
    } catch {
        // Audio not supported
    }
};

const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
};

const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

const PrinterDashboard: React.FC = () => {
    const [orders, setOrders] = useState<PrintOrder[]>([]);
    const [stats, setStats] = useState<PrinterStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchLoading, setDispatchLoading] = useState(false);
    const [undoConfirm, setUndoConfirm] = useState<string | null>(null);
    const [notificationsOn, setNotificationsOn] = useState(true);
    const [flashQueue, setFlashQueue] = useState(false);
    const prevQueueCount = useRef<number | null>(null);

    const load = useCallback(async () => {
        try {
            const [queueData, statsData] = await Promise.all([
                fetchPrinterQueue(),
                fetchPrinterStats(),
            ]);
            setOrders(queueData);
            setStats(statsData);

            // Check for new orders and notify
            const newQueueCount = (queueData as PrintOrder[]).filter((o: PrintOrder) => o.status === 'confirmed').length;
            if (prevQueueCount.current !== null && newQueueCount > prevQueueCount.current && notificationsOn) {
                const diff = newQueueCount - prevQueueCount.current;
                playNotificationSound();
                showBrowserNotification(
                    'New Print Orders',
                    `${diff} new order${diff > 1 ? 's' : ''} in the queue`
                );
                setFlashQueue(true);
                setTimeout(() => setFlashQueue(false), 2000);
            }
            prevQueueCount.current = newQueueCount;
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    }, [notificationsOn]);

    useEffect(() => {
        load();
        requestNotificationPermission();
    }, [load]);

    useEffect(() => {
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [load]);

    const handleStart = async (orderId: string) => {
        setActionLoading(orderId);
        try { await startPrinting(orderId); await load(); }
        catch (err) { console.error(err); }
        finally { setActionLoading(null); }
    };

    const handleDone = async (orderId: string) => {
        setActionLoading(orderId);
        try { await donePrinting(orderId); await load(); }
        catch (err) { console.error(err); }
        finally { setActionLoading(null); }
    };

    const handleUndo = async (orderId: string) => {
        setActionLoading(orderId);
        setUndoConfirm(null);
        try {
            await undoPrinting(orderId);
            setSelectedIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
            await load();
        } catch (err) { console.error(err); }
        finally { setActionLoading(null); }
    };

    const toggleSelected = (orderId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const toggleSelectAll = (printedOrders: PrintOrder[]) => {
        const allIds = printedOrders.map(o => o.id);
        const allSelected = allIds.every(id => selectedIds.has(id));
        setSelectedIds(allSelected ? new Set() : new Set(allIds));
    };

    const handleBatchDispatch = async () => {
        setDispatchLoading(true);
        try {
            await batchDispatch(Array.from(selectedIds));
            setSelectedIds(new Set());
            setShowDispatchModal(false);
            await load();
        } catch (err) { console.error(err); }
        finally { setDispatchLoading(false); }
    };

    const getItemCount = (order: PrintOrder) =>
        order.items.reduce((sum, item) => sum + item.quantity, 0);

    const getSelectedSummary = () => {
        const selected = orders.filter(o => selectedIds.has(o.id));
        const totalItems = selected.reduce((sum, o) => sum + getItemCount(o), 0);
        return { orders: selected, totalItems, totalOrders: selected.length };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    const confirmed = orders.filter(o => o.status === 'confirmed');
    const processing = orders.filter(o => o.status === 'processing');
    const printed = orders.filter(o => o.status === 'printed');
    const dispatched = orders.filter(o => o.status === 'ready_for_pickup');
    const summary = getSelectedSummary();

    return (
        <div className="min-h-screen bg-bone pb-28">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-ink text-bone px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Printer size={20} />
                    <div>
                        <h1 className="font-display text-lg uppercase tracking-tight leading-none">Print Queue</h1>
                        <p className="font-mono text-[10px] text-bone/40 mt-0.5">WEARHSE Production</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setNotificationsOn(!notificationsOn)}
                        className="p-2 rounded-full hover:bg-bone/10 transition-colors"
                        title={notificationsOn ? 'Mute notifications' : 'Enable notifications'}>
                        {notificationsOn ? <Bell size={16} /> : <BellOff size={16} className="text-bone/40" />}
                    </button>
                    <button onClick={load} className="p-2 rounded-full hover:bg-bone/10 transition-colors">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={staffLogout} className="p-2 rounded-full hover:bg-bone/10 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Stats — 2x2 grid on mobile, single row on wider screens */}
            {stats && (
                <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatBox value={stats.awaitingPrint} label="Queue" color="blue" />
                    <StatBox value={stats.inProgress} label="Printing" color="purple" />
                    <StatBox value={stats.printed} label="Printed" color="amber" />
                    <StatBox value={stats.dispatchedToday} label="Sent Today" color="green" />
                </div>
            )}

            <div className="px-4 pb-10 space-y-8">
                {/* ===== QUEUE (confirmed) ===== */}
                {confirmed.length > 0 && (
                    <section>
                        <SectionHeader label="Queue" count={confirmed.length} color="blue" flash={flashQueue} />
                        <div className="space-y-3">
                            {confirmed.map(order => (
                                <OrderCard key={order.id} order={order} loading={actionLoading === order.id}>
                                    <button
                                        onClick={() => handleStart(order.id)}
                                        disabled={actionLoading === order.id}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white font-mono text-[13.5px] uppercase tracking-wider bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                                        Start Printing
                                    </button>
                                </OrderCard>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== PRINTING (processing) ===== */}
                {processing.length > 0 && (
                    <section>
                        <SectionHeader label="Printing" count={processing.length} color="purple" pulse />
                        <div className="space-y-3">
                            {processing.map(order => (
                                <OrderCard key={order.id} order={order} loading={actionLoading === order.id}>
                                    {undoConfirm === order.id ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-[11.5px] text-ink/50">Move back to queue?</span>
                                            <button onClick={() => handleUndo(order.id)}
                                                className="px-3 py-2 rounded-full bg-red-100 text-red-700 font-mono text-[11.5px] hover:bg-red-200 transition-colors">
                                                Yes, undo
                                            </button>
                                            <button onClick={() => setUndoConfirm(null)}
                                                className="px-3 py-2 rounded-full bg-ink/5 text-ink/50 font-mono text-[11.5px] hover:bg-ink/10 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setUndoConfirm(order.id)}
                                                className="flex items-center gap-1.5 px-4 py-3 rounded-full border border-ink/10 text-ink/40 font-mono text-[11.5px] hover:border-ink/25 hover:text-ink/60 transition-colors">
                                                <Undo2 size={14} /> Undo
                                            </button>
                                            <button
                                                onClick={() => handleDone(order.id)}
                                                disabled={actionLoading === order.id}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-white font-mono text-[13.5px] uppercase tracking-wider bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                Done Printing
                                            </button>
                                        </div>
                                    )}
                                </OrderCard>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== PRINTED (holding zone) ===== */}
                {printed.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <SectionHeader label="Printed" count={printed.length} color="amber" noMargin />
                            <button onClick={() => toggleSelectAll(printed)}
                                className="font-mono text-[11.5px] text-amber-600 hover:text-amber-700 transition-colors">
                                {printed.every(o => selectedIds.has(o.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {printed.map(order => {
                                const isSelected = selectedIds.has(order.id);
                                return (
                                    <div key={order.id}
                                        className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                                            isSelected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-ink/8'
                                        } ${actionLoading === order.id ? 'opacity-60 pointer-events-none' : ''}`}
                                    >
                                        {/* Header row with checkbox */}
                                        <div className="px-4 py-3 flex items-center justify-between border-b border-ink/5">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => toggleSelected(order.id)}
                                                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                                                        isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-ink/20 hover:border-amber-400'
                                                    }`}>
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                </button>
                                                <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                                <span className="font-mono text-[11.5px] text-ink/35">{getTimeAgo(order.createdAt)}</span>
                                            </div>
                                            <span className="font-mono text-[11.5px] text-ink/30">
                                                {getItemCount(order)} pc{getItemCount(order) !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Items */}
                                        <div className="px-4 py-3">
                                            <div className="space-y-2">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between py-1">
                                                        <span className="font-mono text-sm font-medium flex-1 min-w-0 truncate">{item.productName}</span>
                                                        <div className="flex items-center gap-3 font-mono text-[13.5px] flex-shrink-0 ml-3">
                                                            <span className="text-ink/50">{item.colorName}</span>
                                                            <span className="w-8 text-center font-medium bg-ink/5 rounded px-1.5 py-0.5">{item.size}</span>
                                                            <span className="w-6 text-center font-bold text-ink/70">x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Undo action */}
                                        <div className="px-4 py-3 border-t border-ink/5">
                                            {undoConfirm === order.id ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-[11.5px] text-ink/50">Move back to printing?</span>
                                                    <button onClick={() => handleUndo(order.id)}
                                                        className="px-3 py-2 rounded-full bg-red-100 text-red-700 font-mono text-[11.5px] hover:bg-red-200 transition-colors">
                                                        Yes, undo
                                                    </button>
                                                    <button onClick={() => setUndoConfirm(null)}
                                                        className="px-3 py-2 rounded-full bg-ink/5 text-ink/50 font-mono text-[11.5px] hover:bg-ink/10 transition-colors">
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setUndoConfirm(order.id)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-ink/10 text-ink/40 font-mono text-[11.5px] hover:border-ink/25 hover:text-ink/60 transition-colors">
                                                    <Undo2 size={14} /> Undo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ===== DISPATCHED (ready_for_pickup — waiting for rider assignment) ===== */}
                {dispatched.length > 0 && (
                    <section>
                        <SectionHeader label="Dispatched" count={dispatched.length} color="green" />
                        <div className="space-y-3">
                            {dispatched.map(order => (
                                <div key={order.id} className="bg-white border border-green-200/60 rounded-xl overflow-hidden opacity-70">
                                    <div className="px-4 py-3 flex items-center justify-between border-b border-green-100">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                            <span className="font-mono text-[11.5px] text-ink/35">{getTimeAgo(order.updatedAt)}</span>
                                        </div>
                                        <span className="font-mono text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                            awaiting rider
                                        </span>
                                    </div>
                                    <div className="px-4 py-3">
                                        <div className="space-y-1.5">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between py-0.5">
                                                    <span className="font-mono text-[12px] text-ink/50 flex-1 min-w-0 truncate">{item.productName}</span>
                                                    <div className="flex items-center gap-2 font-mono text-[12px] flex-shrink-0 ml-3 text-ink/40">
                                                        <span>{item.colorName}</span>
                                                        <span className="bg-ink/5 rounded px-1 py-0.5">{item.size}</span>
                                                        <span className="font-medium text-ink/50">x{item.quantity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {orders.length === 0 && (
                    <div className="text-center py-16">
                        <Printer size={40} className="text-ink/10 mx-auto mb-4" />
                        <p className="font-mono text-sm text-ink/30">No orders in the print queue</p>
                        <p className="font-mono text-[11.5px] text-ink/20 mt-1">New paid orders will appear here automatically</p>
                    </div>
                )}
            </div>

            {/* ===== FLOATING DISPATCH BAR ===== */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink text-bone px-5 py-4 shadow-2xl border-t border-bone/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package size={18} className="text-amber-400" />
                            <div>
                                <p className="font-mono text-sm font-medium">
                                    {summary.totalOrders} order{summary.totalOrders !== 1 ? 's' : ''}
                                </p>
                                <p className="font-mono text-[10px] text-bone/50">
                                    {summary.totalItems} piece{summary.totalItems !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowDispatchModal(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-ink font-mono text-[12px] font-bold uppercase tracking-wider transition-colors">
                            <Truck size={14} />
                            Dispatch
                        </button>
                    </div>
                </div>
            )}

            {/* ===== DISPATCH CONFIRMATION MODAL ===== */}
            {showDispatchModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/60 backdrop-blur-sm">
                    <div className="bg-bone rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
                        <div className="px-5 py-4 border-b border-ink/8 flex items-center justify-between">
                            <div>
                                <h3 className="font-display text-lg uppercase tracking-tight">Confirm Dispatch</h3>
                                <p className="font-mono text-[11.5px] text-ink/40 mt-0.5">Hand these to the rider</p>
                            </div>
                            <button onClick={() => setShowDispatchModal(false)}
                                className="p-2 rounded-full hover:bg-ink/5 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-5 py-4 overflow-y-auto max-h-[50vh] space-y-3">
                            {summary.orders.map(order => (
                                <div key={order.id} className="bg-white rounded-xl p-3 border border-ink/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                        <span className="font-mono text-[11.5px] text-ink/40">
                                            {getItemCount(order)} pc{getItemCount(order) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {order.items.map((item, i) => (
                                        <div key={i} className="font-mono text-[11.5px] text-ink/60 flex justify-between py-0.5">
                                            <span className="truncate">{item.productName} <span className="text-ink/30">{item.colorName} / {item.size}</span></span>
                                            <span className="ml-2 font-medium text-ink/70 flex-shrink-0">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="px-5 py-4 border-t border-ink/8 bg-ink/[0.02]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-mono text-[13.5px] text-ink/60">Total</span>
                                <span className="font-mono text-sm font-bold">
                                    {summary.totalOrders} order{summary.totalOrders !== 1 ? 's' : ''}, {summary.totalItems} pc{summary.totalItems !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <button onClick={handleBatchDispatch} disabled={dispatchLoading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-green-600 hover:bg-green-700 text-white font-mono text-[13.5px] uppercase tracking-wider transition-colors disabled:opacity-50">
                                {dispatchLoading ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                                Confirm Dispatch to Rider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== SUB-COMPONENTS =====

const StatBox: React.FC<{ value: number; label: string; color: 'blue' | 'purple' | 'amber' | 'green' }> = ({ value, label, color }) => {
    const styles = {
        blue: { bg: 'bg-blue-50 border-blue-200', value: 'text-blue-700', label: 'text-blue-500' },
        purple: { bg: 'bg-purple-50 border-purple-200', value: 'text-purple-700', label: 'text-purple-500' },
        amber: { bg: 'bg-amber-50 border-amber-200', value: 'text-amber-700', label: 'text-amber-500' },
        green: { bg: 'bg-green-50 border-green-200', value: 'text-green-700', label: 'text-green-500' },
    };
    const s = styles[color];
    return (
        <div className={`border rounded-xl px-3 py-3 text-center ${s.bg}`}>
            <p className={`font-display text-2xl leading-none ${s.value}`}>{value}</p>
            <p className={`font-mono text-[10px] uppercase tracking-wider mt-1 ${s.label}`}>{label}</p>
        </div>
    );
};

const SectionHeader: React.FC<{
    label: string;
    count: number;
    color: 'blue' | 'purple' | 'amber' | 'green';
    pulse?: boolean;
    flash?: boolean;
    noMargin?: boolean;
}> = ({ label, count, color, pulse, flash, noMargin }) => {
    const dotColors = { blue: 'bg-blue-500', purple: 'bg-purple-500', amber: 'bg-amber-500', green: 'bg-green-500' };
    const textColors = { blue: 'text-blue-600', purple: 'text-purple-600', amber: 'text-amber-600', green: 'text-green-600' };
    return (
        <h2 className={`font-mono text-[11.5px] uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${textColors[color]} ${flash ? 'scale-105 font-bold' : ''} ${noMargin ? '' : 'mb-3'}`}>
            <span className={`w-2 h-2 rounded-full ${dotColors[color]} ${pulse ? 'animate-pulse' : ''}`} />
            {label} ({count})
        </h2>
    );
};

const OrderCard: React.FC<{
    order: PrintOrder;
    loading: boolean;
    children: React.ReactNode;
}> = ({ order, loading, children }) => {
    const timeAgo = getTimeAgo(order.createdAt);
    const pcs = order.items.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className={`bg-white border border-ink/8 rounded-xl overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-ink/5">
                <div>
                    <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                    <span className="font-mono text-[11.5px] text-ink/35 ml-3">{timeAgo}</span>
                </div>
                <span className="font-mono text-[11.5px] text-ink/30">{pcs} pc{pcs !== 1 ? 's' : ''}</span>
            </div>
            <div className="px-4 py-3">
                <div className="space-y-2">
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                            <span className="font-mono text-sm font-medium flex-1 min-w-0 truncate">{item.productName}</span>
                            <div className="flex items-center gap-3 font-mono text-[13.5px] flex-shrink-0 ml-3">
                                <span className="text-ink/50">{item.colorName}</span>
                                <span className="w-8 text-center font-medium bg-ink/5 rounded px-1.5 py-0.5">{item.size}</span>
                                <span className="w-6 text-center font-bold text-ink/70">x{item.quantity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-4 py-3 border-t border-ink/5">
                {children}
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

export default PrinterDashboard;
