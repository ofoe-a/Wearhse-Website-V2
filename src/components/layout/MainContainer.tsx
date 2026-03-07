import React from 'react';
import CartDrawer from '../cart/CartDrawer';

interface MainContainerProps {
    children: React.ReactNode;
}

const MainContainer: React.FC<MainContainerProps> = ({ children }) => {
    return (
        <div className="relative w-full min-h-[100dvh] bg-bone overflow-x-hidden flex flex-col pb-16 md:pb-0">
            {/* Grain overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-[1]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-grow w-full">
                {children}
            </div>

            <CartDrawer />
        </div>
    );
};

export default MainContainer;
