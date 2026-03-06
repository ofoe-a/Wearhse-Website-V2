import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CartItem {
    id: string;
    variantId: string;
    name: string;
    price: string;
    image: string;
    quantity: number;
    size: string;
    color: string;
    stock: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
    removeFromCart: (variantId: string) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    isCartOpen: boolean;
    toggleCart: (isOpen: boolean) => void;
    showToast: boolean;
    toastMessage: string;
}

const CART_STORAGE_KEY = 'wearhse-cart';

function loadCart(): CartItem[] {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(loadCart);

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const toggleCart = (isOpen: boolean) => setIsCartOpen(isOpen);

    const triggerToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const addToCart = (product: Omit<CartItem, 'quantity'>, qty: number = 1) => {
        let toastMsg = '';
        const addQty = Math.max(1, qty);

        setCartItems((prevItems) => {
            const existing = prevItems.find(item => item.variantId === product.variantId);

            if (product.stock <= 0) {
                toastMsg = `${product.name} (${product.size}) is out of stock`;
                return prevItems;
            }

            if (existing) {
                const newQty = Math.min(existing.quantity + addQty, product.stock);
                if (existing.quantity >= product.stock) {
                    toastMsg = `Only ${product.stock} available for ${product.name} (${product.size})`;
                    return prevItems;
                }
                toastMsg = `Added ${product.name} — ${product.color} (${product.size}) × ${addQty} to cart`;
                return prevItems.map(item =>
                    item.variantId === product.variantId
                        ? { ...item, quantity: newQty, stock: product.stock }
                        : item
                );
            }

            const initialQty = Math.min(addQty, product.stock);
            toastMsg = addQty > 1
                ? `Added ${product.name} — ${product.color} (${product.size}) × ${initialQty} to cart`
                : `Added ${product.name} — ${product.color} (${product.size}) to cart`;
            return [...prevItems, { ...product, quantity: initialQty }];
        });

        if (toastMsg) triggerToast(toastMsg);
        setIsCartOpen(true);
    };

    const removeFromCart = (variantId: string) => {
        setCartItems(prev => prev.filter(item => item.variantId !== variantId));
    };

    const updateQuantity = (variantId: string, quantity: number) => {
        if (quantity < 1) return;
        setCartItems(prev =>
            prev.map(item => {
                if (item.variantId !== variantId) return item;
                // Don't exceed stock
                const clampedQty = Math.min(quantity, item.stock);
                return { ...item, quantity: clampedQty };
            })
        );
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
            cartCount, isCartOpen, toggleCart, showToast, toastMessage,
        }}>
            {children}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                <div className="bg-ink text-bone px-6 py-3 rounded-full font-mono text-[13.5px] uppercase tracking-wider shadow-xl flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {toastMessage}
                </div>
            </div>
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
