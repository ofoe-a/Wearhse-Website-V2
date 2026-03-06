import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import type { Product } from '../../services/api';

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const [activeVariant, setActiveVariant] = useState(0);
    const [hovered, setHovered] = useState(false);
    const variant = product.variants[activeVariant];

    const primaryImage = variant.image;
    const altImage = variant.images.length > 1 ? variant.images[1] : null;

    // Split name: last word grey
    const nameWords = product.name.split(' ');
    const lastWord = nameWords.pop();
    const mainName = nameWords.join(' ');

    return (
        <Link
            to={`/product/${product.id}`}
            className="group relative flex flex-col overflow-hidden"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image container */}
            <div className="relative overflow-hidden bg-[#e8e8e4] w-full aspect-[3/4] md:aspect-[3/5]">
                <img
                    src={primaryImage}
                    alt={`${product.name} — ${variant.name}`}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-contain object-center p-6 sm:p-8 md:p-10 transition-all duration-700 ease-out group-hover:scale-105 filter contrast-110 grayscale-[10%] ${
                        altImage && hovered ? 'opacity-0' : 'opacity-100'
                    }`}
                />
                {altImage && (
                    <img
                        src={altImage}
                        alt={`${product.name} — ${variant.name} back`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain object-center p-6 sm:p-8 md:p-10 transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-105 filter contrast-110 grayscale-[10%]"
                    />
                )}
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition-colors duration-500" />

                {/* Color swatches — square container */}
                {product.variants.length > 1 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-bone/80 backdrop-blur-sm px-2 py-1.5 z-10">
                        {product.variants.map((v, i) => (
                            <button
                                key={v.name}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveVariant(i); }}
                                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                                    i === activeVariant ? 'border-ink/40 scale-110' : 'border-ink/10 hover:border-ink/30'
                                }`}
                                style={{ backgroundColor: v.hex }}
                                title={v.name}
                            />
                        ))}
                    </div>
                )}

                {product.featured && (
                    <span className="absolute top-3 left-3 bg-ink text-bone px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.25em]">
                        Featured
                    </span>
                )}

                {/* Item number — bottom left */}
                <span className="absolute bottom-3 left-3 font-mono text-[9px] text-ink/15 tracking-[0.3em]">
                    {String(index + 1).padStart(2, '0')}
                </span>

                {/* Hover CTA — square */}
                <div className="hidden md:flex absolute inset-0 items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="bg-ink text-bone px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] translate-y-3 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                        View Details
                    </span>
                </div>
            </div>

            {/* Product info — newspaper classified style */}
            <div className="border-t border-ink/8 p-3 sm:p-4 flex items-start justify-between gap-2">
                <h3 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-ink/60 leading-tight">
                    <span className="text-ink/70">{mainName}</span>
                    {mainName && ' '}
                    <span className="text-ink/30">{lastWord}</span>
                </h3>
                <span className="font-mono text-[10px] sm:text-[11px] text-ink/35 tracking-tight flex-shrink-0">
                    {product.price}
                </span>
            </div>
        </Link>
    );
};

const ShopSection: React.FC = () => {
    const { products, loading } = useProducts();

    return (
        <section className="w-full bg-bone text-ink" id="shop">
            {/* Section header — editorial */}
            <div className="w-full px-5 md:px-8 lg:px-12 py-8 md:py-12 border-b border-ink/10">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <span className="font-mono text-[9px] text-ink/25 uppercase tracking-[0.4em] block mb-2">
                            The Edit
                        </span>
                        <h2 className="font-display text-[13vw] sm:text-[10vw] md:text-[7vw] lg:text-[5vw] leading-[0.8] tracking-tighter uppercase">
                            <span className="text-ink">Ready to</span>{' '}
                            <span className="text-ink/30">Wear</span>
                        </h2>
                    </div>
                    <span className="hidden sm:block font-mono text-[9px] text-ink/20 uppercase tracking-[0.35em] pb-1">
                        {products.length} {products.length === 1 ? 'piece' : 'pieces'}
                    </span>
                </div>
            </div>

            {/* Product grid — newspaper layout with gap-px borders */}
            <div className="w-full">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <p className="font-mono text-[11px] text-ink/25 uppercase tracking-[0.35em] animate-pulse">
                            Loading...
                        </p>
                    </div>
                ) : (
                    <div className={`grid gap-px bg-ink/8 max-w-6xl mx-auto ${
                        products.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-2'
                    }`}>
                        {products.map((product, i) => (
                            <div key={product.id} className="bg-bone">
                                <ProductCard product={product} index={i} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Back to top — square */}
            <div className="w-full flex justify-center py-8 md:py-12 border-t border-ink/10">
                <a
                    href="#shop"
                    className="group flex items-center gap-3 px-7 py-3 font-mono text-[9px] uppercase tracking-[0.3em] bg-ink text-bone hover:bg-ink/85 transition-colors duration-300"
                >
                    Back to Top
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform -rotate-90" />
                </a>
            </div>
        </section>
    );
};

export default ShopSection;
