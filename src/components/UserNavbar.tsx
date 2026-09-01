import React, { useState } from 'react';
import { ShoppingCart, ClipboardList, LogOut, Menu, X } from 'lucide-react';
import logo from '../assets/icons/logo.png';


interface UserNavbarProps {
    cartCount?: number;
    onCartClick?: () => void;
    onOrdersClick?: () => void;
    onLogout?: () => void;
}

export default function UserNavbar({
    cartCount = 0,
    onCartClick,
    onOrdersClick,
    onLogout
}: UserNavbarProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-3 sm:top-6 z-50 px-2.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-[90%]">
            <nav className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl shadow-slate-900/5 rounded-3xl sm:rounded-full px-5 sm:px-8 py-3 flex items-center justify-between transition-all w-full">
                {/* Brand / Logo */}
                <a href="/Customer" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full  text-white flex items-center justify-center font-bold text-xs shadow-md  group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                        <img className="w-full h-full object-cover rounded-full" src={logo} alt="Kinchris Switch Enterprise Logo" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
                            Kinchris Switch Enterprise
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide">
                            Automotive Store
                        </span>
                    </div>
                </a>

                {/* Desktop Menu Items */}
                <div className="hidden md:flex items-center gap-2.5">
                    <button
                        onClick={onCartClick}
                        className="relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-md transition-all cursor-pointer border border-slate-200/60"
                    >
                        <ShoppingCart className="w-4 h-4 text-slate-600" />
                        <span>Cart</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={onOrdersClick}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-md transition-all cursor-pointer border border-slate-200/60"
                    >
                        <ClipboardList className="w-4 h-4 text-slate-600" />
                        <span>Orders</span>
                    </button>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-50/80 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all cursor-pointer border border-rose-100"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>

                {/* Mobile Menu Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 transition-all cursor-pointer border border-slate-200/70 active:scale-95 shadow-xs"
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X className="w-4.5 h-4.5 text-rose-500" /> : <Menu className="w-4.5 h-4.5" />}
                </button>
            </nav>

            {/* Expanded Full-Width Mobile Dropdown Drawer */}
            {isOpen && (
                <div className="md:hidden absolute left-2.5 right-2.5 top-18 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="bg-white/95 backdrop-blur-3xl border border-white/90 shadow-2xl shadow-slate-950/15 rounded-3xl p-3.5 flex flex-col gap-2 ring-1 ring-slate-900/5 w-full">
                        <button
                            onClick={() => { setIsOpen(false); onCartClick?.(); }}
                            className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all cursor-pointer group border border-slate-200/40"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                                <span className="text-sm">Cart</span>
                            </div>
                            {cartCount > 0 ? (
                                <span className="bg-rose-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                                    {cartCount} items
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-400 font-normal">Empty</span>
                            )}
                        </button>

                        <button
                            onClick={() => { setIsOpen(false); onOrdersClick?.(); }}
                            className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all cursor-pointer group border border-slate-200/40"
                        >
                            <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <ClipboardList className="w-4 h-4" />
                            </div>
                            <span className="text-sm">Payment & Orders</span>
                        </button>

                        <div className="h-px bg-slate-100 my-1 mx-2" />

                        <button
                            onClick={() => { setIsOpen(false); onLogout?.(); }}
                            className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 text-rose-600 text-xs font-semibold transition-all cursor-pointer group border border-rose-100/60"
                        >
                            <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <LogOut className="w-4 h-4" />
                            </div>
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}