import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';
import type { Product, ColorVariant } from '../../services/api';

interface HeroSlide {
    product: Product;
    variant: ColorVariant;
    image: string;
}

const HeroSection: React.FC = () => {
    const { products, loading } = useProducts();
    const [current, setCurrent] = useState(0);

    const featuredProducts = products.filter(p => p.featured).length > 0
        ? products.filter(p => p.featured)
        : products.slice(0, 4);

    const heroSlides: HeroSlide[] = (() => {
        const heroFlagged: HeroSlide[] = featuredProducts.flatMap(product =>
            product.heroImages.map(image => ({
                product,
                variant: product.variants.find(v => v.images.includes(image)) || product.variants[0],
                image,
            }))
        );
        if (heroFlagged.length > 0) return heroFlagged;
        return featuredProducts.flatMap(product =>
            product.variants.flatMap(variant =>
                variant.images.map(image => ({ product, variant, image }))
            )
        );
    })();

    const total = heroSlides.length;

    const next = useCallback(() => {
        if (total === 0) return;
        setCurrent((prev) => (prev + 1) % total);
    }, [total]);

    const prev = useCallback(() => {
        if (total === 0) return;
        setCurrent((prev) => (prev - 1 + total) % total);
    }, [total]);

    useEffect(() => {
        if (total === 0) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next, total]);

    if (loading || heroSlides.length === 0) {
        return (
            <section className="relative w-full h-[100dvh] flex items-center justify-center bg-bone">
                <div className="animate-pulse space-y-4 text-center">
                    <div className="w-12 h-12 border border-ink/10 mx-auto" />
                    <p className="font-mono text-[11px] text-ink/30 uppercase tracking-[0.3em]">Loading...</p>
                </div>
            </section>
        );
    }

    const slide = heroSlides[current % total];
    const slideNum = String(current + 1).padStart(2, '0');
    const totalNum = String(total).padStart(2, '0');

    // Split name: last word grey
    const nameWords = slide.product.name.split(' ');
    const lastWord = nameWords.pop();
    const mainName = nameWords.join(' ');

    return (
        <section className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-bone">
            {/* ===== DESKTOP LAYOUT ===== */}
            <div className="hidden md:flex flex-1 relative">
                {/* Left column — product info */}
                <div className="w-[42%] lg:w-[38%] flex flex-col justify-between px-8 lg:px-12 py-16 z-20 border-r border-ink/5">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="space-y-5">
                            <div key={`name-${current}`}>
                                <span className="font-mono text-[9px] text-ink/25 uppercase tracking-[0.4em] block mb-3">
                                    {slideNum} / {totalNum}
                                </span>
                                <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl uppercase leading-[0.85] tracking-tighter">
                                    <span className="text-ink">{mainName}</span>
                                    {mainName && ' '}
                                    <span className="text-ink/30">{lastWord}</span>
                                </h1>
                            </div>
                            <p className="font-mono text-lg lg:text-xl text-ink/40 tracking-tight" key={`price-${current}`}>
                                {slide.product.price}
                            </p>
                            <Link
                                to={`/product/${slide.product.id}`}
                                className="inline-flex items-center gap-3 bg-ink text-bone w-12 h-12 justify-center hover:bg-ink/85 transition-all duration-300 hover:scale-105"
                            >
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Tagline — bottom left */}
                    <div className="space-y-2 border-t border-ink/8 pt-6">
                        <h2 className="font-display text-lg lg:text-xl leading-tight max-w-[280px] tracking-tighter">
                            Made in Ghana.<br />Worn everywhere.
                        </h2>
                        <p className="font-mono text-[9px] text-ink/25 uppercase tracking-[0.35em]">
                            Designed for the culture
                        </p>
                    </div>
                </div>

                {/* Center — product image */}
                <div className="flex-1 relative flex items-end justify-center overflow-hidden pb-4">
                    {heroSlides.map((s, index) => (
                        <img
                            key={`${s.product.id}-${s.variant.name}-${index}`}
                            src={s.image}
                            alt={`${s.product.name} — ${s.variant.name}`}
                            className={`absolute bottom-4 h-[85%] w-auto max-w-none object-contain object-bottom drop-shadow-xl filter contrast-110 grayscale-[10%] transition-all duration-700 ease-out ${
                                index === current
                                    ? 'opacity-100 z-10 translate-x-0 scale-100'
                                    : 'opacity-0 z-0 translate-x-8 scale-[0.97]'
                            }`}
                        />
                    ))}
                </div>

                {/* Right column — navigation + vertical text */}
                <div className="w-[18%] lg:w-[16%] flex flex-col justify-between items-end px-8 lg:px-12 py-16 z-20 border-l border-ink/5">
                    <div className="flex items-center gap-4">
                        {/* Square dots */}
                        <div className="flex items-center gap-1.5">
                            {heroSlides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`transition-all duration-300 ${
                                        i === current
                                            ? 'w-2.5 h-2.5 bg-ink'
                                            : 'w-1.5 h-1.5 bg-ink/20 hover:bg-ink/50'
                                    }`}
                                />
                            ))}
                        </div>
                        {/* Square arrow button */}
                        <button
                            onClick={next}
                            className="flex items-center justify-center w-10 h-10 border border-ink/15 hover:border-ink/40 transition-colors"
                        >
                            <ArrowRight size={15} />
                        </button>
                    </div>

                    {/* Vertical brand text */}
                    <span
                        className="font-mono text-[9px] uppercase tracking-[0.5em] text-ink/8"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        WEARHSE
                    </span>
                </div>
            </div>

            {/* ===== MOBILE LAYOUT ===== */}
            <div className="flex md:hidden flex-1 flex-col relative">
                <div className="flex-1 relative flex items-end justify-center overflow-hidden pb-4">
                    {heroSlides.map((s, index) => (
                        <img
                            key={`mobile-${s.product.id}-${s.variant.name}-${index}`}
                            src={s.image}
                            alt={`${s.product.name} — ${s.variant.name}`}
                            className={`absolute bottom-4 h-[82%] w-auto max-w-none object-contain object-bottom drop-shadow-xl filter contrast-110 grayscale-[10%] transition-all duration-700 ${
                                index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                        />
                    ))}
                </div>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-7 pt-28 bg-gradient-to-t from-bone via-bone/85 to-transparent">
                    <div className="flex items-end justify-between mb-3">
                        <div className="space-y-0.5">
                            <span className="font-mono text-[9px] text-ink/25 uppercase tracking-[0.4em] block">
                                {slideNum}/{totalNum}
                            </span>
                            <h1 className="font-display text-2xl uppercase leading-[0.85] tracking-tighter">
                                <span className="text-ink">{mainName}</span>
                                {mainName && ' '}
                                <span className="text-ink/30">{lastWord}</span>
                            </h1>
                            <p className="font-mono text-sm text-ink/40 tracking-tight">{slide.product.price}</p>
                        </div>
                    </div>

                    {/* Dots + arrows — square */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                            {heroSlides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`transition-all duration-300 ${
                                        i === current ? 'w-2 h-2 bg-ink' : 'w-1.5 h-1.5 bg-ink/25'
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button onClick={prev} className="w-9 h-9 border border-ink/15 flex items-center justify-center rotate-180">
                                <ArrowRight size={13} />
                            </button>
                            <button onClick={next} className="w-9 h-9 border border-ink/15 flex items-center justify-center">
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Tagline + CTA */}
                    <div className="flex items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="font-display text-sm leading-tight text-ink tracking-tighter">
                                Made in Ghana. Worn everywhere.
                            </h2>
                            <p className="font-mono text-[8px] text-ink/25 uppercase tracking-[0.35em]">
                                Designed for the culture
                            </p>
                        </div>
                        <Link
                            to={`/product/${slide.product.id}`}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] bg-ink text-bone"
                        >
                            Shop
                            <ArrowDown size={11} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== MARQUEE TICKER ===== */}
            <div className="absolute bottom-0 left-0 right-0 z-30 overflow-hidden border-t border-ink/8 bg-bone/80 backdrop-blur-sm hidden md:block">
                <div className="animate-marquee flex items-center whitespace-nowrap py-2">
                    {[...Array(8)].map((_, i) => (
                        <span key={i} className="font-mono text-[9px] uppercase tracking-[0.4em] text-ink/12 mx-8">
                            WEARHSE &middot; Made in Ghana &middot; Worn Everywhere &middot; Streetwear &middot; Culture
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
