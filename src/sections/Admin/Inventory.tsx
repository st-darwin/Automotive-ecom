import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Disc, Droplets, Wrench, ArrowUpRight } from 'lucide-react';

const stores = [
    {
        id: 'tyres',
        name: 'Mega Tyre',
        category: 'Tyre Store',
        description: 'High-performance radial tyres, heavy-duty treads, and specialized alignment components.',
        route: 'tyres',
        icon: Disc,
        accent: 'from-blue-600 via-indigo-600 to-violet-600',
        glow: 'group-hover:shadow-blue-500/20',
        badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        iconBg: 'bg-blue-600 text-white',
    },
    {
        id: 'grease',
        name: 'Boothman Grease',
        category: 'Lubricants & Fluids',
        description: 'Synthetic motor oils, industrial greases, and high-temp automotive lubrication formulas.',
        route: 'grease',
        icon: Droplets,
        accent: 'from-amber-500 via-orange-600 to-rose-600',
        glow: 'group-hover:shadow-amber-500/20',
        badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        iconBg: 'bg-amber-500 text-white',
    },
    {
        id: 'motorparts',
        name: 'Motor Parts',
        category: 'Hardware & Spares',
        description: 'Precision switches, electrical relays, mechanical assemblies, and core engine parts.',
        route: 'motor-parts',
        icon: Wrench,
        accent: 'from-emerald-600 via-teal-600 to-cyan-600',
        glow: 'group-hover:shadow-emerald-500/20',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        iconBg: 'bg-emerald-600 text-white',
    }
];

const Inventory = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <Header
                title="Select Your Store"
                description="Choose a specialized department below to manage stock levels, price points, and active inventory pipelines."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stores.map((store) => {
                    const IconComponent = store.icon;
                    return (
                        <div
                            key={store.id}
                            onClick={() => navigate(store.route)}
                            className={`group relative cursor-pointer bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl ${store.glow} hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between overflow-hidden active:scale-[0.98]`}
                        >
                            {/* Ambient background glow orb on hover */}
                            <div className={`absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br ${store.accent} rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none`} />

                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className={`p-4 rounded-2xl ${store.iconBg} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold border ${store.badgeBg} uppercase tracking-widest`}>
                                        {store.category}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                        {store.name}
                                    </h2>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                        {store.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between relative z-10">
                                <span className="text-xs font-semibold text-slate-900 tracking-wider uppercase group-hover:translate-x-1 transition-transform">
                                    Open Store
                                </span>
                                <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center  transition-all duration-300 shadow-md group-hover:rotate-45">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Inventory;