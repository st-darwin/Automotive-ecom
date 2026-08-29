
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Disc, Droplets, Wrench, ChevronRight } from 'lucide-react';

const stores = [
    {
        id: 'tyres',
        name: 'Mega Tyre',
        category: 'Tyre Store',
        description: 'High-performance radial tyres, heavy-duty treads, and specialized alignment components.',
        route: 'tyres',
        icon: Disc,
        accent: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50/50',
        badgeColor: 'bg-blue-50 text-blue-600 border-blue-100/60',
    },
    {
        id: 'grease',
        name: 'Boothman Grease',
        category: 'Lubricants & Fluids',
        description: 'Synthetic motor oils, industrial greases, and high-temp automotive lubrication formulas.',
        route: 'grease',
        icon: Droplets,
        accent: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50/50',
        badgeColor: 'bg-amber-50 text-amber-600 border-amber-100/60',
    },
    {
        id: 'motorparts',
        name: 'Motor Parts',
        category: 'Hardware & Spares',
        description: 'Precision switches, electrical relays, mechanical assemblies, and core engine parts.',
        route: 'motor-parts',
        icon: Wrench,
        accent: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50/50',
        badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100/60',
    }
];

const Inventory = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
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
                            className="group relative cursor-pointer bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 flex flex-col justify-between overflow-hidden active:scale-[0.98]"
                        >
                            {/* Subtle top accent gradient bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${store.accent} opacity-80`} />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3.5 rounded-2xl ${store.bgLight} transition-transform duration-300 group-hover:scale-110`}>
                                        <IconComponent className="w-6 h-6 text-slate-700" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${store.badgeColor} uppercase tracking-wider`}>
                                        {store.category}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                        {store.name}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                        {store.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 tracking-tight uppercase">
                                    Manage Store
                                </span>
                                <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
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