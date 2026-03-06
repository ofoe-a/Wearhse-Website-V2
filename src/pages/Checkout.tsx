import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Loader2, Truck } from 'lucide-react';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';
import { useCart } from '../context/CartContext';
import { parsePrice } from '../utils/price';
import { checkout, fetchShippingZones } from '../services/api';

interface DeliveryZone {
    id: string;
    label: string;
    description: string;
    cost: number;
    costPesewas: number;
}

const Checkout: React.FC = () => {
    const { cartItems } = useCart();
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zone, setZone] = useState('');
    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);

    useEffect(() => {
        fetchShippingZones()
            .then(setDeliveryZones)
            .catch(() => setError('Failed to load delivery zones'))
            .finally(() => setZonesLoading(false));
    }, []);

    const [form, setForm] = useState({
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        region: '',
    });

    const update = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const subtotal = cartItems.reduce((acc, item) => {
        return acc + (parsePrice(item.price) * item.quantity);
    }, 0);

    const selectedZone = deliveryZones.find(z => z.id === zone);
    const shippingCost = selectedZone?.cost ?? 0;
    const total = subtotal + shippingCost;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0) return;

        if (!form.email || !form.firstName || !form.lastName || !form.addressLine1 || !form.city) {
            setError('Please fill in all required fields');
            return;
        }

        if (!zone) {
            setError('Please select a delivery zone');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await checkout({
                email: form.email,
                phone: form.phone || undefined,
                shipping: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone || undefined,
                    addressLine1: form.addressLine1,
                    addressLine2: form.addressLine2 || undefined,
                    city: form.city,
                    region: form.region || undefined,
                    zone,
                },
                items: cartItems.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
            });

            // Show redirecting state, then navigate to Paystack
            // Don't clear cart yet — clear it on the verification page after payment succeeds
            setRedirecting(true);
            window.location.href = result.authorizationUrl;
        } catch (err: any) {
            setError(err.message || 'Checkout failed. Please try again.');
            setLoading(false);
        }
    };

    if (redirecting) {
        return (
            <MainContainer>
                <Navbar />
                <div className="flex-grow flex items-center justify-center px-6">
                    <div className="text-center space-y-5">
                        <Loader2 size={32} className="animate-spin text-ink/40 mx-auto" />
                        <h2 className="font-display text-2xl uppercase">Redirecting to Payment</h2>
                        <p className="font-mono text-sm text-ink/50">You'll be taken to Paystack to complete your order.</p>
                        <p className="font-mono text-[11.5px] text-ink/30">Please don't close this window.</p>
                    </div>
                </div>
            </MainContainer>
        );
    }

    if (cartItems.length === 0) {
        return (
            <MainContainer>
                <Navbar />
                <div className="flex-grow flex items-center justify-center px-6">
                    <div className="text-center space-y-4">
                        <h2 className="font-display text-2xl uppercase">Your cart is empty</h2>
                        <p className="font-mono text-sm text-ink/50">Add some items before checking out.</p>
                        <Link to="/" className="inline-block font-mono text-sm underline underline-offset-4 hover:text-ink/60 transition-colors">Back to Shop</Link>
                    </div>
                </div>
            </MainContainer>
        );
    }

    return (
        <MainContainer>
            <Navbar />

            {/* Breadcrumb */}
            <div className="w-full px-6 md:px-8 lg:px-12 py-3 border-b border-ink/5">
                <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-ink/40 uppercase tracking-wider">
                    <Link to="/" className="hover:text-ink/70 transition-colors">Home</Link>
                    <ChevronRight size={10} />
                    <span className="text-ink/70">Checkout</span>
                </div>
            </div>

            <div className="flex-grow w-full flex flex-col lg:flex-row">
                {/* Form Section */}
                <div className="w-full lg:w-[60%] px-6 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
                    <div className="max-w-lg">
                        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[13.5px] text-ink/50 hover:text-ink transition-colors mb-8">
                            <ArrowLeft size={14} /> Back to shop
                        </Link>

                        <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[0.85] tracking-tight mb-10">Checkout</h1>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Contact */}
                            <div className="space-y-4">
                                <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40">Contact</h2>
                                <input type="email" placeholder="Email *" required value={form.email} onChange={e => update('email', e.target.value)}
                                    className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={e => update('phone', e.target.value)}
                                    className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                            </div>

                            {/* Delivery Zone */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Truck size={14} className="text-ink/30" />
                                    <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40">Delivery Area</h2>
                                </div>
                                <div className="space-y-2">
                                    {zonesLoading ? (
                                        <div className="flex items-center gap-2 py-4 font-mono text-sm text-ink/40">
                                            <Loader2 size={14} className="animate-spin" />
                                            Loading delivery zones...
                                        </div>
                                    ) : deliveryZones.length === 0 ? (
                                        <p className="font-mono text-sm text-ink/40 py-2">No delivery zones available</p>
                                    ) : deliveryZones.map(z => (
                                        <label
                                            key={z.id}
                                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                                zone === z.id
                                                    ? 'border-ink/40 bg-ink/[0.03]'
                                                    : 'border-ink/10 hover:border-ink/20'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="zone"
                                                value={z.id}
                                                checked={zone === z.id}
                                                onChange={() => setZone(z.id)}
                                                className="mt-0.5 accent-ink"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-sm font-medium">{z.label}</span>
                                                    <span className="font-mono text-sm font-medium shrink-0 ml-2">
                                                        {z.cost === 0 ? 'Free' : `GHS ${z.cost}`}
                                                    </span>
                                                </div>
                                                <p className="font-mono text-[11.5px] text-ink/35 mt-0.5 leading-relaxed">{z.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                            </div>

                            {/* Shipping Address */}
                            <div className="space-y-4">
                                <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40">Shipping Address</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="First name *" required value={form.firstName} onChange={e => update('firstName', e.target.value)}
                                        className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                    <input type="text" placeholder="Last name *" required value={form.lastName} onChange={e => update('lastName', e.target.value)}
                                        className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                </div>
                                <input type="text" placeholder="Address *" required value={form.addressLine1} onChange={e => update('addressLine1', e.target.value)}
                                    className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                <input type="text" placeholder="Apartment, suite, etc. (optional)" value={form.addressLine2} onChange={e => update('addressLine2', e.target.value)}
                                    className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="City *" required value={form.city} onChange={e => update('city', e.target.value)}
                                        className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                    <input type="text" placeholder="Region (optional)" value={form.region} onChange={e => update('region', e.target.value)}
                                        className="w-full bg-transparent border-b border-ink/15 py-3 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25" />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="font-mono text-[13.5px] text-red-600">{error}</p>
                                </div>
                            )}

                            <button type="submit" disabled={loading || !zone}
                                className="w-full py-4 sm:py-5 rounded-full font-mono text-sm uppercase tracking-widest bg-ink text-bone hover:bg-ink/85 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay GHS ${total.toLocaleString()}`
                                )}
                            </button>

                            <p className="font-mono text-[11.5px] text-ink/30 text-center">
                                Secure payment powered by Paystack
                            </p>
                        </form>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-[40%] bg-white/30 border-t lg:border-t-0 lg:border-l border-ink/10 px-6 sm:px-8 lg:px-12 py-8 lg:py-12">
                    <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 mb-6">Order Summary</h2>

                    <div className="space-y-4 mb-8">
                        {cartItems.map(item => (
                            <div key={item.variantId} className="flex gap-4">
                                <div className="w-16 h-20 bg-white/50 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                                </div>
                                <div className="flex-grow flex justify-between">
                                    <div>
                                        <h3 className="font-mono text-[13.5px] uppercase">{item.name}</h3>
                                        <p className="font-mono text-[11.5px] text-ink/40">{item.color} · {item.size} · Qty: {item.quantity}</p>
                                    </div>
                                    <span className="font-mono text-[13.5px] font-medium">{item.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-ink/10 pt-4 space-y-3">
                        <div className="flex justify-between font-mono text-[13.5px]">
                            <span className="text-ink/50">Subtotal</span>
                            <span>GHS {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-mono text-[13.5px]">
                            <span className="text-ink/50">Delivery</span>
                            <span>
                                {!zone
                                    ? 'Select area'
                                    : shippingCost === 0
                                    ? 'Free'
                                    : `GHS ${shippingCost}`}
                            </span>
                        </div>
                        <div className="flex justify-between font-mono text-sm font-bold border-t border-ink/10 pt-3">
                            <span>Total</span>
                            <span>GHS {total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </MainContainer>
    );
};

export default Checkout;
