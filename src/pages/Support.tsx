import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Mail, Phone, MessageCircle, Package, RotateCcw, Truck, HelpCircle } from 'lucide-react';
import MainContainer from '../components/layout/MainContainer';
import Navbar from '../components/nav/Navbar';
import Footer from '../components/layout/Footer';

const FAQ_ITEMS = [
    {
        q: 'How long does delivery take?',
        a: 'Within Accra: 1–3 business days (free delivery). Outside Accra: 3–7 business days (GHS 30).',
    },
    {
        q: 'Can I return or exchange an item?',
        a: 'Yes — you have 14 days from delivery to request a return or exchange. Items must be unworn with tags attached.',
    },
    {
        q: 'How do I track my order?',
        a: 'Go to our Track Order page and enter your order number and email. You\'ll see real-time status updates.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept mobile money (MTN, Vodafone, AirtelTigo) and card payments (Visa, Mastercard) via Paystack.',
    },
    {
        q: 'Do you ship outside Ghana?',
        a: 'Not yet — we currently deliver within Ghana only. International shipping is coming soon.',
    },
];

const Support: React.FC = () => {
    return (
        <MainContainer>
            <Navbar showBackButton />

            <div className="flex-grow w-full px-6 md:px-8 lg:px-12 py-10 md:py-16">
                <div className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-6">
                        <Link to="/" className="hover:text-ink/70 transition-colors">Home</Link>
                        <ChevronRight size={10} />
                        <span className="text-ink/70">Support</span>
                    </div>

                    {/* Header */}
                    <h1 className="font-display text-3xl sm:text-4xl uppercase leading-tight tracking-tight mb-2">How Can We Help?</h1>
                    <p className="font-mono text-[13.5px] text-ink/50 mb-10">Find answers below or reach out to us directly.</p>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
                        <Link to="/track" className="flex items-center gap-3 p-5 border border-ink/10 rounded-xl hover:border-ink/25 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center group-hover:bg-ink/10 transition-colors">
                                <Package size={18} className="text-ink/60" />
                            </div>
                            <div>
                                <span className="font-mono text-sm font-medium block">Track Order</span>
                                <span className="font-mono text-[11.5px] text-ink/40">Check your status</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3 p-5 border border-ink/10 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
                                <Truck size={18} className="text-ink/60" />
                            </div>
                            <div>
                                <span className="font-mono text-sm font-medium block">Shipping Info</span>
                                <span className="font-mono text-[11.5px] text-ink/40">Free within Accra</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-5 border border-ink/10 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
                                <RotateCcw size={18} className="text-ink/60" />
                            </div>
                            <div>
                                <span className="font-mono text-sm font-medium block">Returns</span>
                                <span className="font-mono text-[11.5px] text-ink/40">14-day policy</span>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mb-14">
                        <div className="flex items-center gap-2 mb-6">
                            <HelpCircle size={18} className="text-ink/40" />
                            <h2 className="font-display text-xl uppercase">Frequently Asked Questions</h2>
                        </div>
                        <div className="divide-y divide-ink/10 border-t border-b border-ink/10">
                            {FAQ_ITEMS.map((item, i) => (
                                <details key={i} className="group">
                                    <summary className="flex items-center justify-between py-4 cursor-pointer font-mono text-sm text-ink/80 hover:text-ink transition-colors">
                                        {item.q}
                                        <ChevronRight size={14} className="text-ink/30 group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <p className="pb-4 font-sans text-sm text-ink/60 leading-relaxed pl-0">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="border border-ink/10 rounded-xl p-6 sm:p-8">
                        <h2 className="font-display text-xl uppercase mb-6">Still Need Help?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <a href="mailto:support@wearhse.com" className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-ink flex items-center justify-center group-hover:bg-ink/85 transition-colors">
                                    <Mail size={18} className="text-bone" />
                                </div>
                                <div>
                                    <span className="font-mono text-sm font-medium block">Email Us</span>
                                    <span className="font-mono text-[13.5px] text-ink/40">support@wearhse.com</span>
                                </div>
                            </a>

                            <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '233551234567'}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center group-hover:bg-green-800 transition-colors">
                                    <MessageCircle size={18} className="text-bone" />
                                </div>
                                <div>
                                    <span className="font-mono text-sm font-medium block">WhatsApp</span>
                                    <span className="font-mono text-[13.5px] text-ink/40">Chat with us</span>
                                </div>
                            </a>

                            <a href={`tel:+${import.meta.env.VITE_PHONE_NUMBER || '233551234567'}`} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-ink/10 flex items-center justify-center group-hover:bg-ink/15 transition-colors">
                                    <Phone size={18} className="text-ink/70" />
                                </div>
                                <div>
                                    <span className="font-mono text-sm font-medium block">Call Us</span>
                                    <span className="font-mono text-[13.5px] text-ink/40">Mon–Fri, 9am–6pm</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </MainContainer>
    );
};

export default Support;
