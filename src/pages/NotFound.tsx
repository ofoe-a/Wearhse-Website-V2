import React from 'react';
import { Link } from 'react-router-dom';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';

const NotFound: React.FC = () => {
    return (
        <MainContainer>
            <Navbar showBackButton />
            <div className="flex-grow flex items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <h1 className="font-display text-6xl sm:text-8xl uppercase tracking-tight">404</h1>
                    <p className="font-mono text-sm text-ink/50 uppercase tracking-widest">Page not found</p>
                    <Link
                        to="/"
                        className="inline-block mt-4 px-8 py-3 rounded-full font-mono text-[13.5px] uppercase tracking-widest bg-ink text-bone hover:bg-ink/85 transition-colors"
                    >
                        Back to Shop
                    </Link>
                </div>
            </div>
        </MainContainer>
    );
};

export default NotFound;
