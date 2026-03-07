import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-ink text-bone">
            {/* Marquee strip */}
            <div className="overflow-hidden border-b border-bone/5 py-2.5">
                <div className="animate-marquee flex items-center whitespace-nowrap">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="font-mono text-[9px] uppercase tracking-[0.45em] text-bone/6 mx-6">
                            WEARHSE &middot; Accra &middot; Streetwear &middot; Culture &middot; Ghana-Made
                        </span>
                    ))}
                </div>
            </div>

            <div className="px-5 md:px-8 lg:px-12 py-10 md:py-14">
                {/* Top row — brand */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10 md:mb-14 pb-8 border-b border-bone/6">
                    <Link to="/" className="block">
                        <img src="/images/Logo-Color.svg" alt="WEARHSE" className="h-20 sm:h-24 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
                    </Link>
                    <p className="font-mono text-[9px] text-bone/15 uppercase tracking-[0.35em] max-w-xs">
                        Made in Ghana. Worn everywhere.
                    </p>
                </div>

                {/* Links grid — spec-sheet style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 mb-10 md:mb-14">
                    <div>
                        <h4 className="font-mono text-[8px] uppercase tracking-[0.45em] text-bone/20 mb-4">Shop</h4>
                        <nav className="flex flex-col gap-3">
                            <a href="/#shop" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">All Products</a>
                            <a href="/#shop" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">New Arrivals</a>
                        </nav>
                    </div>

                    <div>
                        <h4 className="font-mono text-[8px] uppercase tracking-[0.45em] text-bone/20 mb-4">Help</h4>
                        <nav className="flex flex-col gap-3">
                            <Link to="/track" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">Track Order</Link>
                            <Link to="/support" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">Contact Support</Link>
                            <Link to="/support" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">Shipping & Returns</Link>
                        </nav>
                    </div>

                    <div>
                        <h4 className="font-mono text-[8px] uppercase tracking-[0.45em] text-bone/20 mb-4">Connect</h4>
                        <nav className="flex flex-col gap-3">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">Instagram</a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">Twitter / X</a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-bone/40 hover:text-bone transition-colors tracking-wide">TikTok</a>
                        </nav>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-bone/6 mb-6" />

                {/* Bottom row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="font-mono text-[9px] text-bone/12 tracking-[0.25em] uppercase">
                        &copy; {new Date().getFullYear()} WEARHSE. Accra, Ghana.
                    </p>
                    <div className="flex items-center gap-5">
                        <Link to="/track" className="font-mono text-[9px] text-bone/20 hover:text-bone transition-colors uppercase tracking-[0.25em]">Track Order</Link>
                        <Link to="/support" className="font-mono text-[9px] text-bone/20 hover:text-bone transition-colors uppercase tracking-[0.25em]">Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
