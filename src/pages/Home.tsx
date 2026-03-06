import React from 'react';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';
import HeroSection from '../components/home/HeroSection';
import ShopSection from '../components/home/ShopSection';
import Footer from '../components/layout/Footer';

const Home: React.FC = () => {
    return (
        <MainContainer>
            <Navbar />
            <div className="flex-grow w-full">
                <HeroSection />
                <ShopSection />
            </div>
            <Footer />
        </MainContainer>
    );
};

export default Home;
