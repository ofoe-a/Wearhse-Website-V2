import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Loader2, ChevronRight, CheckCircle2, Clock, Truck, MapPin, Printer, PackageCheck } from 'lucide-react';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';
import Footer from '../components/layout/Footer';
import { trackOrder, type TrackedOrder } from '../services/api';

const STATUS_STEPS = ['confirmed', 'processing', 'printed', 'ready_for_pickup', 'shipped', 'delivered'];

const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    pending: { label: 'Pending', icon: <Clock size={18} />, color: 'text-yellow-600' },
    confirmed: { label: 'Confirmed', icon: <CheckCircle2 size={18} />, color: 'text-blue-600' },
    processing: { label: 'Processing', icon: <Package size={18} />, color: 'text-purple-600' },
    printed: { label: 'Printed', icon: <Printer size={18} />, color: 'text-violet-600' },
    ready_for_pickup: { label: 'Ready', icon: <PackageCheck size={18} />, color: 'text-orange-600' },
    shipped: { label: 'Shipped', icon: <Truck size={18} />, color: 'text-indigo-600' },
    delivered: { label: 'Delivered', icon: <MapPin size={18} />, color: 'text-green-600' },
    cancelled: { label: 'Cancelled', icon: <Clock size={18} />, color: 'text-red-600' },
};

const TrackOrder: React.FC = () => {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber.trim() || !email.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const result = await trackOrder(orderNumber.trim(), email.trim());
            setOrder(result);
        } catch (err: any) {
            setError(err.message || 'Failed to find order');
        } finally {
            setLoading(false);
        }
    };

    const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

    return (
        <MainContainer>
            <Navbar showBackButton />

            <div className="flex-grow w-full px-6 md:px-8 lg:px-12 py-10 md:py-16">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-6">
                            <Link to="/" className="hover:text-ink/70 transition-colors">Home</Link>
                            <ChevronRight size={10} />
                            <span className="text-ink/70">Track Order</span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl uppercase leading-tight tracking-tight mb-2">Track Your Order</h1>
                        <p className="font-mono text-[13.5px] text-ink/50">Enter your order number and email to see your order status.</p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleTrack} className="space-y-4 mb-10">
                        <div>
                            <label className="font-mono text-[11.5px] text-ink/50 uppercase tracking-wider block mb-2">Order Number</label>
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={e => setOrderNumber(e.target.value)}
                                placeholder="e.g. WRH-A1B2C3"
                                className="w-full px-4 py-3 border border-ink/15 rounded-lg font-mono text-sm bg-white/50 focus:outline-none focus:border-ink/40 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="font-mono text-[11.5px] text-ink/50 uppercase tracking-wider block mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="The email you used at checkout"
                                className="w-full px-4 py-3 border border-ink/15 rounded-lg font-mono text-sm bg-white/50 focus:outline-none focus:border-ink/40 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !orderNumber.trim() || !email.trim()}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-ink text-bone font-mono text-sm uppercase tracking-widest disabled:opacity-40 hover:bg-ink/85 transition-colors"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            {loading ? 'Searching...' : 'Track Order'}
                        </button>
                    </form>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-8">
                            <p className="font-mono text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Order Result */}
                    {order && (
                        <div className="border border-ink/10 rounded-xl overflow-hidden">
                            {/* Order Header */}
                            <div className="p-6 bg-white/50 border-b border-ink/10">
                                <div className="flex items-start justify-between gap-4 mb-1">
                                    <h2 className="font-display text-xl uppercase">Order {order.orderNumber}</h2>
                                    <span className={`font-mono text-[11.5px] uppercase tracking-wider font-medium ${STATUS_INFO[order.status]?.color || 'text-ink/50'}`}>
                                        {STATUS_INFO[order.status]?.label || order.status}
                                    </span>
                                </div>
                                <p className="font-mono text-[13.5px] text-ink/40">
                                    Placed {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Progress Tracker */}
                            {order.status !== 'cancelled' && order.status !== 'pending' && (
                                <div className="p-6 border-b border-ink/10">
                                    <div className="flex items-center justify-between">
                                        {STATUS_STEPS.map((step, i) => {
                                            const isActive = i <= currentStepIndex;
                                            const info = STATUS_INFO[step];
                                            return (
                                                <React.Fragment key={step}>
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                                            isActive ? 'bg-ink text-bone' : 'bg-ink/5 text-ink/25'
                                                        }`}>
                                                            {info.icon}
                                                        </div>
                                                        <span className={`font-mono text-[10px] uppercase tracking-wider ${isActive ? 'text-ink/70' : 'text-ink/25'}`}>
                                                            {info.label}
                                                        </span>
                                                    </div>
                                                    {i < STATUS_STEPS.length - 1 && (
                                                        <div className={`flex-1 h-px mx-2 ${i < currentStepIndex ? 'bg-ink' : 'bg-ink/10'}`} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            <div className="p-6 border-b border-ink/10">
                                <h3 className="font-mono text-[11.5px] text-ink/40 uppercase tracking-widest mb-4">Items</h3>
                                <div className="space-y-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div>
                                                <span className="font-mono text-sm text-ink/80">{item.productName}</span>
                                                <span className="font-mono text-[13.5px] text-ink/40 ml-2">
                                                    {item.colorName} / {item.size} × {item.quantity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="p-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between font-mono text-[13.5px] text-ink/50">
                                        <span>Subtotal</span>
                                        <span>GHS {order.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-mono text-[13.5px] text-ink/50">
                                        <span>Shipping{order.city ? ` to ${order.city}` : ''}</span>
                                        <span>{order.shipping === 0 ? 'Free' : `GHS ${order.shipping.toFixed(2)}`}</span>
                                    </div>
                                    <div className="h-px bg-ink/10 my-2" />
                                    <div className="flex justify-between font-mono text-sm font-medium">
                                        <span>Total</span>
                                        <span>GHS {order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </MainContainer>
    );
};

export default TrackOrder;
