import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const CollectionPreview: React.FC = () => {
    return (
        <div className="flex flex-col gap-3">
            {/* Preview Card */}
            <div className="w-[180px] h-[200px] lg:w-[220px] lg:h-[240px] bg-white border border-ink/10 rounded-2xl p-3 flex flex-col items-center justify-between shadow-sm hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden">
                <div className="w-full h-3/4 overflow-hidden rounded-xl">
                    <img
                        src="https://plus.unsplash.com/premium_photo-1673327093310-fa9d790bfcd2?q=80&w=300&auto=format&fit=crop"
                        alt="New Collection Puffer"
                        className="w-full h-full object-cover mix-blend-multiply filter contrast-125 group-hover:scale-110 transition-transform duration-700"
                    />
                </div>
                <div className="w-full text-center pt-1">
                    <span className="font-display text-base lg:text-lg">2026</span>
                </div>
            </div>

            {/* Button */}
            <button className="flex items-center justify-between w-full px-4 py-2.5 border border-ink/20 rounded-full font-mono text-[11.5px] uppercase tracking-wider hover:bg-ink hover:text-bone hover:border-ink transition-all duration-300 group">
                <span>new collection</span>
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
        </div>
    );
};

export default CollectionPreview;
