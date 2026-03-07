import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Home, Search, Truck, MessageCircle } from 'lucide-react';
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
    const { cartCount, toggleCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavClick = (to: string) => {
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

    const isActive = (to: string) => {
        if (to === '/') return location.pathname === '/';
        if (to.includes('#')) return location.pathname === '/' || location.pathname === to.split('#')[0];
        return location.pathname.startsWith(to);
    };

    return (
        <>
            {/* ═══ TOP NAVBAR ═══ */}
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

                {/* Right: Cart (desktop shows label, mobile just icon in bottom nav) */}
                <div className="flex items-center gap-3 min-w-[80px] justify-end">
                    <button
                        onClick={() => toggleCart(true)}
                        className="hidden md:flex items-center gap-1.5 hover:text-ink transition-colors relative"
                    >
                        <ShoppingBag size={17} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-bone text-[8px] flex items-center justify-center font-bold">
                                {cartCount}
                            </span>
                        )}
                        <span className="ml-1">Bag</span>
                    </button>
                </div>
            </nav>

            {/* ═══ MOBILE BOTTOM NAV ═══ */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bone/95 backdrop-blur-md border-t border-ink/8">
                <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {/* Home */}
                    <button
                        onClick={() => handleNavClick('/')}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                            isActive('/') && !isActive('/#shop') ? 'text-ink' : 'text-ink/40'
                        }`}
                    >
                        <Home size={20} strokeWidth={isActive('/') ? 2.5 : 1.5} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em]">Home</span>
                    </button>

                    {/* Shop */}
                    <button
                        onClick={() => handleNavClick('/#shop')}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                            isActive('/#shop') ? 'text-ink' : 'text-ink/40'
                        }`}
                    >
                        <Search size={20} strokeWidth={1.5} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em]">Shop</span>
                    </button>

                    {/* Bag */}
                    <button
                        onClick={() => toggleCart(true)}
                        className="flex flex-col items-center gap-0.5 px-3 py-1 text-ink/40 relative transition-colors"
                    >
                        <div className="relative">
                            <ShoppingBag size={20} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-2 w-4 h-4 bg-ink text-bone text-[7px] flex items-center justify-center font-bold rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em]">Bag</span>
                    </button>

                    {/* Track */}
                    <button
                        onClick={() => handleNavClick('/track')}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                            isActive('/track') ? 'text-ink' : 'text-ink/40'
                        }`}
                    >
                        <Truck size={20} strokeWidth={isActive('/track') ? 2.5 : 1.5} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em]">Track</span>
                    </button>

                    {/* Support */}
                    <button
                        onClick={() => handleNavClick('/support')}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                            isActive('/support') ? 'text-ink' : 'text-ink/40'
                        }`}
                    >
                        <MessageCircle size={20} strokeWidth={isActive('/support') ? 2.5 : 1.5} />
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em]">Help</span>
                    </button>
                </div>
            </div>

        </>
    );
};

export default Navbar;
