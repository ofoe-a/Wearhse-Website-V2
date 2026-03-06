import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { parsePrice } from '../../utils/price';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';

const CartDrawer: React.FC = () => {
    const { isCartOpen, toggleCart, cartItems, removeFromCart, updateQuantity } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isCartOpen) {
                toggleCart(false);
            }
        };
        if (isCartOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen, toggleCart]);

    const subtotal = cartItems.reduce((acc, item) => {
        return acc + (parsePrice(item.price) * item.quantity);
    }, 0);

    const handleCheckout = () => {
        toggleCart(false);
        navigate('/checkout');
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
            <div ref={drawerRef} className={`fixed top-0 right-0 h-full w-full sm:w-[420px] md:w-[450px] bg-bone z-50 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-5 border-b border-ink/10 flex-shrink-0">
                    <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight">
                        Cart
                        <span className="font-mono text-[13.5px] text-ink/40 ml-2 normal-case tracking-wider">
                            {cartItems.reduce((acc, item) => acc + item.quantity, 0)} items
                        </span>
                    </h2>
                    <button onClick={() => toggleCart(false)} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-grow overflow-y-auto px-5 sm:px-6 py-4 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-ink/40 space-y-4 py-20">
                            <ShoppingBag size={40} strokeWidth={1} />
                            <p className="font-mono text-sm uppercase tracking-widest">Your cart is empty</p>
                            <button onClick={() => toggleCart(false)} className="font-mono text-[13.5px] underline underline-offset-4 hover:text-ink transition-colors">Continue Shopping</button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.variantId} className="flex gap-3 sm:gap-4">
                                <Link to={`/product/${item.id}`} onClick={() => toggleCart(false)} className="w-20 h-26 sm:w-24 sm:h-32 bg-white/50 flex-shrink-0 rounded-lg overflow-hidden">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                                </Link>
                                <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-mono text-[13.5px] sm:text-sm uppercase truncate">{item.name}</h3>
                                            <p className="font-mono text-[13.5px] sm:text-sm font-medium flex-shrink-0">{item.price}</p>
                                        </div>
                                        <p className="font-mono text-[11.5px] text-ink/40 mt-0.5">{item.color} · Size: {item.size}</p>
                                    </div>
                                    {item.quantity >= item.stock && (
                                        <p className="font-mono text-[10px] text-amber-600 mt-1">Max {item.stock} available</p>
                                    )}
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex items-center border border-ink/15 rounded-full h-8">
                                            <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="w-8 h-full flex items-center justify-center hover:bg-ink/5 rounded-l-full transition-colors disabled:opacity-20" disabled={item.quantity <= 1}>
                                                <Minus size={11} />
                                            </button>
                                            <span className="font-mono text-[11px] w-5 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-8 h-full flex items-center justify-center hover:bg-ink/5 rounded-r-full transition-colors disabled:opacity-20" disabled={item.quantity >= item.stock}>
                                                <Plus size={11} />
                                            </button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.variantId)} className="text-ink/30 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="px-5 sm:px-6 py-5 border-t border-ink/10 bg-bone space-y-4 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-[13.5px] uppercase tracking-widest text-ink/60">Subtotal</span>
                            <span className="font-mono text-base sm:text-lg font-bold">GHS {subtotal.toLocaleString()}</span>
                        </div>
                        <p className="font-mono text-[11.5px] text-ink/35 text-center">Shipping & taxes calculated at checkout</p>
                        <button onClick={handleCheckout} className="w-full bg-ink text-bone py-4 font-mono text-[13.5px] sm:text-sm uppercase tracking-widest rounded-full hover:bg-ink/85 transition-colors duration-300">
                            Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
