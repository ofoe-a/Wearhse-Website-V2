import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
    showBackButton?: boolean;
}

interface NavLink {
    label: string;
    to: string;
}

const navLinks: NavLink[] = [
    { label: 'main', to: '/' },
    { label: 'shop', to: '/#shop' },
    { label: 'track order', to: '/track' },
    { label: 'support', to: '/support' },
];

const Navbar: React.FC<NavbarProps> = ({ showBackButton }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cartCount, toggleCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavClick = (to: string) => {
        setIsMenuOpen(false);
        if (to.includes('#')) {
            const [path, hash] = to.split('#');
            if (location.pathname === path || (path === '/' && location.pathname === '/')) {
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
            } else {
                navigate(to);
            }
        } else {
            navigate(to);
        }
    };

    return (
        <>
            <nav className="w-full flex items-center justify-between px-5 py-4 md:px-8 md:py-5 lg:px-12 font-mono text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-ink/70 select-none relative z-50">
                {/* Left: Back button or brand */}
                <div className="flex items-center gap-3 min-w-[80px]">
                    {showBackButton ? (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 hover:text-ink transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline text-[11px]">Back</span>
                        </button>
                    ) : (
                        <Link to="/" className="block">
                            <img src="/images/Logo-Color.svg" alt="WEARHSE" className="h-14 sm:h-16 w-auto" />
                        </Link>
                    )}
                </div>

                {/* Center: Desktop nav links */}
                <div className="hidden md:flex items-center gap-6 lg:gap-10">
                    {navLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => handleNavClick(link.to)}
                            className="hover:text-ink transition-colors duration-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-ink hover:after:w-full after:transition-all after:duration-300"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* Right: Cart + mobile menu */}
                <div className="flex items-center gap-3 min-w-[80px] justify-end">
                    <button
                        onClick={() => toggleCart(true)}
                        className="flex items-center gap-1.5 hover:text-ink transition-colors relative"
                    >
                        <ShoppingBag size={17} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-bone text-[8px] flex items-center justify-center font-bold">
                                {cartCount}
                            </span>
                        )}
                        <span className="hidden md:inline ml-1">Bag</span>
                    </button>

                    <button
                        className="md:hidden p-1 ml-1"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-bone z-40 flex flex-col items-center justify-center gap-5 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                    isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
                }`}
            >
                {navLinks.map((link, i) => (
                    <button
                        key={link.label}
                        onClick={() => handleNavClick(link.to)}
                        className="font-display text-3xl sm:text-4xl uppercase tracking-tighter text-ink hover:text-accent-gray transition-colors"
                        style={{ transitionDelay: isMenuOpen ? `${i * 50}ms` : '0ms' }}
                    >
                        {link.label}
                    </button>
                ))}
                <div className="mt-6 pt-6 border-t border-ink/10 w-48 flex justify-center">
                    <button
                        onClick={() => { toggleCart(true); setIsMenuOpen(false); }}
                        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors"
                    >
                        <ShoppingBag size={15} />
                        Cart ({cartCount})
                    </button>
                </div>
            </div>
        </>
    );
};

export default Navbar;
