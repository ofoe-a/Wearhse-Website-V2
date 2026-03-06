import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, User, CreditCard, UserPlus } from 'lucide-react';
import { fetchOrder, updateOrderStatus } from './services/adminApi';
import StatusBadge from './components/StatusBadge';
import RiderAssignModal from './components/RiderAssignModal';

const statusFlow = ['pending', 'confirmed', 'processing', 'printed', 'ready_for_pickup', 'shipped', 'delivered'];

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    shipping: number;
    total: number;
    customer: { email: string; phone: string; firstName: string; lastName: string };
    shippingAddress: {
        firstName: string; lastName: string; phone: string;
        addressLine1: string; addressLine2: string;
        city: string; region: string;
    };
    items: Array<{
        id: string; productName: string; colorName: string;
        colorHex: string; size: string; quantity: number; unitPrice: number;
    }>;
    paystackReference: string;
    createdAt: string;
}

const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    useEffect(() => {
        if (id) fetchOrder(id).then(setOrder).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!id || !order) return;
        setUpdating(true);
        try {
            await updateOrderStatus(id, newStatus);
            setOrder({ ...order, status: newStatus });
        } catch (err) {
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    if (!order) return <p className="font-mono text-sm text-ink/40 py-12 text-center">Order not found</p>;

    const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link to="/admin/orders" className="p-1.5 rounded-lg hover:bg-ink/5 transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="font-display text-xl uppercase">{order.orderNumber}</h1>
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.paymentStatus} />
                    </div>
                    <p className="font-mono text-[13.5px] text-ink/40 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main content — 2 cols */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="border border-ink/8 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-ink/8 bg-ink/[0.02]">
                            <span className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Items</span>
                        </div>
                        <div className="divide-y divide-ink/8">
                            {order.items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                                    {/* Color dot */}
                                    <div
                                        className="w-8 h-8 rounded-full border border-ink/10 shrink-0"
                                        style={{ backgroundColor: item.colorHex || '#ccc' }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-sm font-medium">{item.productName}</p>
                                        <p className="font-mono text-[13.5px] text-ink/40">{item.colorName} · {item.size} · Qty {item.quantity}</p>
                                    </div>
                                    <p className="font-mono text-sm shrink-0">GHS {(item.unitPrice * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        {/* Totals */}
                        <div className="border-t border-ink/8 px-5 py-4 space-y-2">
                            <div className="flex justify-between font-mono text-[13.5px] text-ink/40">
                                <span>Subtotal</span>
                                <span>GHS {order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-mono text-[13.5px] text-ink/40">
                                <span>Shipping</span>
                                <span>{order.shipping === 0 ? 'Free' : `GHS ${order.shipping.toFixed(2)}`}</span>
                            </div>
                            <div className="flex justify-between font-mono text-sm font-medium pt-2 border-t border-ink/8">
                                <span>Total</span>
                                <span>GHS {order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status update */}
                    {nextStatus && order.status !== 'cancelled' && (
                        <div className="border border-ink/8 rounded-xl p-5">
                            <p className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35 mb-3">Update Status</p>
                            <div className="flex flex-wrap gap-2">
                                {order.status === 'ready_for_pickup' ? (
                                    <button
                                        onClick={() => setAssignModalOpen(true)}
                                        className="px-5 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider bg-ink text-bone hover:bg-ink/85 transition-colors flex items-center gap-2"
                                    >
                                        <UserPlus size={14} />
                                        Assign Rider
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleStatusChange(nextStatus)}
                                        disabled={updating}
                                        className="px-5 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider bg-ink text-bone hover:bg-ink/85 disabled:opacity-50 transition-colors"
                                    >
                                        {updating ? 'Updating...' : `Mark as ${nextStatus.replace('_', ' ')}`}
                                    </button>
                                )}
                                {order.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleStatusChange('cancelled')}
                                        disabled={updating}
                                        className="px-5 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar — customer + shipping */}
                <div className="space-y-6">
                    {/* Customer */}
                    <div className="border border-ink/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={14} className="text-ink/30" />
                            <span className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Customer</span>
                        </div>
                        <p className="font-mono text-sm font-medium">
                            {order.customer.firstName} {order.customer.lastName}
                        </p>
                        {order.customer.email && (
                            <p className="font-mono text-[13.5px] text-ink/40 mt-1">{order.customer.email}</p>
                        )}
                        {order.customer.phone && (
                            <p className="font-mono text-[13.5px] text-ink/40">{order.customer.phone}</p>
                        )}
                    </div>

                    {/* Shipping address */}
                    <div className="border border-ink/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={14} className="text-ink/30" />
                            <span className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Shipping</span>
                        </div>
                        <div className="font-mono text-[13.5px] text-ink/60 space-y-0.5">
                            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>{order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''}</p>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="border border-ink/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard size={14} className="text-ink/30" />
                            <span className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Payment</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[13.5px] text-ink/40">Status</span>
                            <StatusBadge status={order.paymentStatus} />
                        </div>
                        {order.paystackReference && (
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[13.5px] text-ink/40">Reference</span>
                                <span className="font-mono text-[11.5px] text-ink/40">{order.paystackReference}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rider Assignment Modal */}
            <RiderAssignModal
                isOpen={assignModalOpen}
                orderId={order.id}
                orderNumber={order.orderNumber}
                customer={`${order.customer.firstName} ${order.customer.lastName}`}
                city={order.shippingAddress.city}
                onClose={() => setAssignModalOpen(false)}
                onAssigned={() => {
                    setAssignModalOpen(false);
                    setOrder({ ...order, status: 'shipped' });
                }}
            />
        </div>
    );
};

export default OrderDetail;
