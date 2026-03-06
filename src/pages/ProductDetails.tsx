import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, Share2 } from 'lucide-react';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';
import Footer from '../components/layout/Footer';

import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { products, loading, getProductById } = useProducts();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState(0);
    const [currentImage, setCurrentImage] = useState(0);
    const [shake, setShake] = useState(false);
    const [added, setAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const product = id ? getProductById(id) : undefined;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        setSelectedSize(null);
        setSelectedColor(0);
        setCurrentImage(0);
        setAdded(false);
        setQuantity(1);
    }, [id]);

    useEffect(() => {
        setCurrentImage(0);
    }, [selectedColor]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }
        if (product) {
            const variant = product.variants[selectedColor];
            const sizeVariant = variant.sizes.find(s => s.size === selectedSize);
            if (!sizeVariant || sizeVariant.stock <= 0) return;
            addToCart({
                id: product.id,
                name: product.name,
                price: `GHS ${sizeVariant.pricePesewas / 100}`,
                image: variant.image,
                size: selectedSize,
                color: variant.name,
                variantId: sizeVariant.variantId,
                stock: sizeVariant.stock,
            }, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: product?.name, url: window.location.href });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(window.location.href);
        }
    };

    if (loading) {
        return (
            <MainContainer>
                <Navbar />
                <div className="flex-grow flex items-center justify-center h-full px-6">
                    <p className="font-mono text-[11px] text-ink/30 uppercase tracking-[0.3em] animate-pulse">Loading...</p>
                </div>
            </MainContainer>
        );
    }

    if (!product) {
        return (
            <MainContainer>
                <Navbar />
                <div className="flex-grow flex items-center justify-center h-full px-6">
                    <div className="text-center space-y-4">
                        <h2 className="font-display text-2xl uppercase tracking-tighter">Product not found</h2>
                        <p className="font-mono text-[12px] text-ink/40">The item you're looking for doesn't exist.</p>
                        <button onClick={() => navigate('/')} className="font-mono text-[12px] underline underline-offset-4 hover:text-ink/60 transition-colors">Back to Collection</button>
                    </div>
                </div>
            </MainContainer>
        );
    }

    const variant = product.variants[selectedColor];
    const variantImages = variant.images;
    const availableSizes = variant.sizes.filter(s => s.stock > 0).map(s => s.size);
    const allSizes = variant.sizes.map(s => s.size);

    const selectedSizeData = selectedSize ? variant.sizes.find(s => s.size === selectedSize) : null;
    const displayPricePesewas = selectedSizeData?.pricePesewas || variant.sizes[0]?.pricePesewas || 0;
    const displayPrice = `GHS ${(displayPricePesewas / 100).toFixed(2)}`;
    const totalPrice = `GHS ${((displayPricePesewas * quantity) / 100).toFixed(2)}`;
    const maxQty = selectedSizeData?.stock || 10;

    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    // Split product name: last word gets grey treatment
    const nameWords = product.name.split(' ');
    const lastWord = nameWords.pop();
    const mainName = nameWords.join(' ');

    return (
        <MainContainer>
            <Navbar showBackButton />

            {/* ─── PRODUCT LAYOUT ─── */}
            <div className="flex-grow w-full flex flex-col lg:flex-row">

                {/* ═══ IMAGE SECTION ═══ */}
                <div className="w-full lg:w-[55%] xl:w-[58%] relative">
                    <div className="lg:sticky lg:top-0">
                        <div className="relative bg-[#e8e8e4] aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-screen flex items-center justify-center overflow-hidden">
                            <img
                                src={variantImages[currentImage]}
                                alt={`${product.name} — ${variant.name}`}
                                className="max-h-full max-w-full object-contain p-6 sm:p-10 lg:p-16 mix-blend-multiply filter contrast-110 grayscale-[10%] transition-opacity duration-500"
                            />

                            {/* Share */}
                            <button
                                onClick={handleShare}
                                className="absolute top-4 right-4 w-9 h-9 border border-ink/10 bg-bone/80 backdrop-blur-sm flex items-center justify-center hover:bg-bone transition-colors"
                                title="Share"
                            >
                                <Share2 size={14} className="text-ink/60" />
                            </button>

                            {/* Arrow navigation */}
                            {variantImages.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImage((prev) => (prev - 1 + variantImages.length) % variantImages.length)}
                                        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-ink/10 bg-bone/70 backdrop-blur-sm items-center justify-center hover:bg-bone transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImage((prev) => (prev + 1) % variantImages.length)}
                                        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-ink/10 bg-bone/70 backdrop-blur-sm items-center justify-center hover:bg-bone transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}

                            {/* Vertical thumbnails (desktop) */}
                            {variantImages.length > 1 && (
                                <div className="hidden lg:flex flex-col gap-2 absolute right-5 top-1/2 -translate-y-1/2">
                                    {variantImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentImage(i)}
                                            className={`w-14 h-14 xl:w-16 xl:h-16 overflow-hidden border transition-all duration-200 bg-white ${
                                                i === currentImage
                                                    ? 'border-ink shadow-md scale-105'
                                                    : 'border-ink/10 hover:border-ink/30 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Image counter — bottom left */}
                            <span className="absolute bottom-4 left-4 font-mono text-[10px] text-ink/25 tracking-[0.3em]">
                                {String(currentImage + 1).padStart(2, '0')}/{String(variantImages.length).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Horizontal thumbnails (mobile) */}
                        {variantImages.length > 1 && (
                            <div className="lg:hidden flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide bg-bone">
                                {variantImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImage(i)}
                                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border transition-all duration-200 bg-white ${
                                            i === currentImage
                                                ? 'border-ink shadow-md'
                                                : 'border-ink/10 hover:border-ink/30 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ DETAILS SECTION — Editorial / Spec Sheet ═══ */}
                <div className="w-full lg:w-[45%] xl:w-[42%] border-t lg:border-t-0 lg:border-l border-ink/10 bg-bone">
                    <div className="flex flex-col pb-40 lg:pb-0">

                        {/* ── Header block: category + title + price ── */}
                        <div className="px-5 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-12 pb-5 border-b border-ink/10">
                            <span className="font-mono text-[9px] text-ink/25 uppercase tracking-[0.4em] block mb-3">
                                {product.category}
                            </span>
                            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.8rem] uppercase leading-[0.85] tracking-tighter mb-4">
                                <span className="text-ink">{mainName}</span>
                                {mainName && ' '}
                                <span className="text-ink/30">{lastWord}</span>
                            </h1>
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="font-mono text-xl sm:text-2xl tracking-tight text-ink/80">
                                    {displayPrice}
                                </span>
                                <button onClick={handleShare} className="font-mono text-[9px] text-ink/25 uppercase tracking-[0.3em] hover:text-ink/50 transition-colors hidden sm:block">
                                    Share ↗
                                </button>
                            </div>
                        </div>

                        {/* ── Spec pills ── */}
                        {product.details.length > 0 && (
                            <div className="px-5 sm:px-8 lg:px-10 py-4 border-b border-ink/10 flex flex-wrap gap-1.5">
                                {product.details.map((detail, index) => (
                                    <span
                                        key={index}
                                        className="px-2.5 py-1 border border-ink/10 font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40"
                                    >
                                        {detail}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* ── Color ── */}
                        {product.variants.length > 1 && (
                            <div className="px-5 sm:px-8 lg:px-10 py-5 border-b border-ink/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink/30">Color</h3>
                                    <span className="font-mono text-[11px] text-ink/50">{variant.name}</span>
                                </div>
                                <div className="flex gap-3">
                                    {product.variants.map((v, i) => (
                                        <button
                                            key={v.name}
                                            onClick={() => setSelectedColor(i)}
                                            className={`w-9 h-9 rounded-full transition-all duration-200 ${
                                                i === selectedColor
                                                    ? 'ring-2 ring-ink ring-offset-2 ring-offset-bone scale-110'
                                                    : 'ring-1 ring-ink/15 hover:ring-ink/40'
                                            }`}
                                            style={{ backgroundColor: v.hex }}
                                            title={v.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Size ── */}
                        <div className="px-5 sm:px-8 lg:px-10 py-5 border-b border-ink/10">
                            <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink/30 mb-3">Select Size</h3>
                            <div className={`flex gap-2 flex-wrap transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                                {allSizes.map((size) => {
                                    const inStock = availableSizes.includes(size);
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => inStock && setSelectedSize(size)}
                                            disabled={!inStock}
                                            className={`h-11 min-w-[2.75rem] px-4 border flex items-center justify-center font-mono text-[12px] tracking-[0.1em] transition-all duration-200 ${
                                                !inStock
                                                    ? 'border-ink/5 text-ink/15 cursor-not-allowed line-through'
                                                    : selectedSize === size
                                                        ? 'bg-ink text-bone border-ink'
                                                        : 'border-ink/15 hover:border-ink/40 text-ink/60 hover:text-ink'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                            {shake && !selectedSize && (
                                <p className="font-mono text-[10px] text-red-500 mt-2 animate-pulse tracking-wide">Please select a size</p>
                            )}
                            {selectedSize && (() => {
                                const sizeData = variant.sizes.find(s => s.size === selectedSize);
                                if (!sizeData) return null;
                                if (sizeData.stock === 0) return (
                                    <p className="font-mono text-[10px] text-red-500 mt-2 tracking-wide">Out of stock</p>
                                );
                                if (sizeData.stock <= 3) return (
                                    <p className="font-mono text-[10px] text-amber-600 mt-2 tracking-wide">Only {sizeData.stock} left</p>
                                );
                                return null;
                            })()}
                        </div>

                        {/* ── Quantity + Total ── */}
                        <div className="px-5 sm:px-8 lg:px-10 py-5 border-b border-ink/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink/30 mb-2">Qty</h3>
                                    <div className="flex items-center border border-ink/15 overflow-hidden">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-10 h-10 flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center font-mono text-[13px] font-medium tabular-nums border-l border-r border-ink/15">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                                            className="w-10 h-10 flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink/30 mb-2">Total</h3>
                                    <p className="font-mono text-2xl sm:text-3xl font-semibold text-ink tracking-tight tabular-nums">
                                        {totalPrice}
                                    </p>
                                    {quantity > 1 && (
                                        <p className="font-mono text-[10px] text-ink/30 tracking-wide">{displayPrice} each</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Add to Cart (desktop) ── */}
                        <div className="hidden lg:block px-5 sm:px-8 lg:px-10 py-5 border-b border-ink/10">
                            {(() => {
                                const sizeData = selectedSize ? variant.sizes.find(s => s.size === selectedSize) : null;
                                const outOfStock = sizeData?.stock === 0;
                                return (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={outOfStock}
                                        className={`w-full py-4 font-mono text-[11px] uppercase tracking-[0.3em] transition-all duration-300 active:scale-[0.98] ${
                                            outOfStock
                                                ? 'bg-ink/15 text-ink/30 cursor-not-allowed'
                                                : added
                                                    ? 'bg-green-800 text-bone'
                                                    : 'bg-ink text-bone hover:bg-ink/90'
                                        }`}
                                    >
                                        {outOfStock ? 'Out of Stock' : added ? 'Added to Cart ✓' : 'Add to Cart'}
                                    </button>
                                );
                            })()}
                        </div>

                        {/* ── Description ── */}
                        {product.description && (
                            <div className="px-5 sm:px-8 lg:px-10 py-5 border-b border-ink/10">
                                <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink/30 mb-3">Description</h3>
                                <p className="font-mono text-[12px] text-ink/45 leading-relaxed tracking-wide">{product.description}</p>
                            </div>
                        )}

                        {/* ── Shipping / Returns — spec-sheet style ── */}
                        <div className="px-5 sm:px-8 lg:px-10 py-5">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-ink/25 uppercase tracking-[0.2em]">Delivery</span>
                                    <span className="font-mono text-[10px] text-ink/40 tracking-wide">Free within Accra</span>
                                </div>
                                <div className="w-full h-px bg-ink/5" />
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-ink/25 uppercase tracking-[0.2em]">Returns</span>
                                    <span className="font-mono text-[10px] text-ink/40 tracking-wide">14 days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── STICKY MOBILE ADD-TO-CART BAR ─── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bone/95 backdrop-blur-md border-t border-ink/10 px-4 pt-3 pb-safe-bottom">
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-lg font-semibold text-ink tabular-nums truncate tracking-tight">
                            {quantity > 1 ? totalPrice : displayPrice}
                        </p>
                        {quantity > 1 && (
                            <p className="font-mono text-[9px] text-ink/30 tracking-[0.2em]">{quantity} items</p>
                        )}
                    </div>
                    {(() => {
                        const sizeData = selectedSize ? variant.sizes.find(s => s.size === selectedSize) : null;
                        const outOfStock = sizeData?.stock === 0;
                        return (
                            <button
                                onClick={handleAddToCart}
                                disabled={outOfStock}
                                className={`flex-shrink-0 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.97] ${
                                    outOfStock
                                        ? 'bg-ink/15 text-ink/30 cursor-not-allowed'
                                        : added
                                            ? 'bg-green-800 text-bone'
                                            : 'bg-ink text-bone'
                                }`}
                            >
                                {outOfStock ? 'Sold Out' : added ? 'Added ✓' : 'Add to Cart'}
                            </button>
                        );
                    })()}
                </div>
            </div>

            {/* ─── RELATED PRODUCTS ─── */}
            {related.length > 0 && (
                <section className="w-full border-t border-ink/10">
                    <div className="px-5 sm:px-8 lg:px-12 py-8 md:py-12">
                        <div className="flex items-end justify-between mb-6">
                            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tighter">You may also like</h3>
                            <span className="font-mono text-[9px] text-ink/20 uppercase tracking-[0.3em]">{related.length} items</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-ink/8 overflow-hidden">
                            {related.map((item) => (
                                <Link to={`/product/${item.id}`} key={item.id} className="group flex flex-col bg-bone">
                                    <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e8e4]">
                                        <img
                                            src={item.variants[0].image}
                                            alt={item.name}
                                            loading="lazy"
                                            className="absolute inset-0 w-full h-full object-contain p-6 sm:p-8 group-hover:scale-105 transition-transform duration-700 filter contrast-110 grayscale-[10%]"
                                        />
                                    </div>
                                    <div className="p-3 sm:p-4 border-t border-ink/8">
                                        <h4 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-ink/60">{item.name}</h4>
                                        <span className="font-mono text-[10px] sm:text-[11px] text-ink/35">{item.price}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <Footer />
        </MainContainer>
    );
};

export default ProductDetails;
