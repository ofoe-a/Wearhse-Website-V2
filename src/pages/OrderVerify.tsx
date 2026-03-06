import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';
import { verifyPayment } from '../services/api';
import { useCart } from '../context/CartContext';

type VerifyState = 'loading' | 'success' | 'failed';

interface OrderDetails {
    orderNumber: string;
    status: string;
    total: number;
    email: string;
}

const OrderVerify: React.FC = () => {
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference');
    const { clearCart } = useCart();
    const [state, setState] = useState<VerifyState>('loading');
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!reference) {
            setState('failed');
            setErrorMsg('No payment reference found.');
            return;
        }

        const verify = async () => {
            try {
                const result = await verifyPayment(reference);
                if (result.status === 'success') {
                    setOrder({
                        orderNumber: result.orderNumber || '',
                        status: 'confirmed',
                        total: result.total || 0,
                        email: result.email || '',
                    });
                    clearCart();
                    setState('success');
                } else {
                    setState('failed');
                    setErrorMsg(result.message || 'Payment was not successful.');
                }
            } catch {
                setState('failed');
                setErrorMsg('Payment verification failed. Please contact support if you were charged.');
            }
        };

        verify();
    }, [reference]);

    return (
        <MainContainer>
            <Navbar />

            <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">

                {/* Loading */}
                {state === 'loading' && (
                    <div className="text-center">
                        <Loader2 size={40} className="animate-spin mx-auto text-ink/30 mb-6" />
                        <h1 className="font-display text-2xl uppercase mb-2">Verifying Payment</h1>
                        <p className="font-mono text-sm text-ink/40">Please wait...</p>
                    </div>
                )}

                {/* Success */}
                {state === 'success' && (
                    <div className="w-full max-w-sm text-center">
                        <CheckCircle size={48} strokeWidth={1.5} className="mx-auto text-green-500 mb-6" />
                        <h1 className="font-display text-3xl uppercase mb-2">Order Confirmed</h1>
                        <p className="font-mono text-sm text-ink/40 mb-10">Thank you for your purchase!</p>

                        {order && (
                            <div className="border border-ink/10 rounded-xl divide-y divide-ink/10 mb-10">
                                {order.orderNumber && (
                                    <div className="flex justify-between items-center px-5 py-4">
                                        <span className="font-mono text-[13.5px] uppercase tracking-wider text-ink/40">Order</span>
                                        <span className="font-mono text-sm">{order.orderNumber}</span>
                                    </div>
                                )}
                                {order.total > 0 && (
                                    <div className="flex justify-between items-center px-5 py-4">
                                        <span className="font-mono text-[13.5px] uppercase tracking-wider text-ink/40">Total</span>
                                        <span className="font-mono text-sm font-medium">GHS {order.total.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center px-5 py-4">
                                    <span className="font-mono text-[13.5px] uppercase tracking-wider text-ink/40">Status</span>
                                    <span className="font-mono text-sm text-green-600">Confirmed</span>
                                </div>
                                {order.email && (
                                    <div className="flex justify-between items-center px-5 py-4">
                                        <span className="font-mono text-[13.5px] uppercase tracking-wider text-ink/40">Receipt to</span>
                                        <span className="font-mono text-sm truncate ml-4">{order.email}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <Link
                            to="/"
                            className="block w-full py-4 rounded-full font-mono text-sm uppercase tracking-widest bg-ink text-bone hover:bg-ink/85 transition-colors text-center"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                )}

                {/* Failed */}
                {state === 'failed' && (
                    <div className="w-full max-w-sm text-center">
                        <XCircle size={48} strokeWidth={1.5} className="mx-auto text-red-400 mb-6" />
                        <h1 className="font-display text-3xl uppercase mb-2">Payment Issue</h1>
                        <p className="font-mono text-sm text-ink/40 mb-10">{errorMsg}</p>

                        <div className="space-y-3">
                            <Link
                                to="/checkout"
                                className="block w-full py-4 rounded-full font-mono text-sm uppercase tracking-widest bg-ink text-bone hover:bg-ink/85 transition-colors text-center"
                            >
                                Try Again
                            </Link>
                            <Link
                                to="/"
                                className="block w-full py-4 rounded-full font-mono text-sm uppercase tracking-widest border border-ink/15 hover:bg-ink/5 transition-colors text-center"
                            >
                                Back to Shop
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </MainContainer>
    );
};

export default OrderVerify;
