
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Droplet, CircleDot, Wrench, ArrowRight } from 'lucide-react';

const OrdersPage = () => {
    const navigate = useNavigate();

    const orderStores = [
        {
            title: 'Grease Orders',
            description: 'Manage lubricant requests, quantities, bulk barrels, and customer dispatches.',
            icon: Droplet,
            path: '/orders/grease',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'hover:border-amber-300',
        },
        {
            title: 'Tyre Orders',
            description: 'View and fulfill vehicle tyre requests, sizing details, and brand inventories.',
            icon: CircleDot,
            path: '/orders/tyres',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'hover:border-blue-300',
        },
        {
            title: 'Motor Parts Orders',
            description: 'Track component orders, replacement hardware, pricing, and category fulfillment.',
            icon: Wrench,
            path: '/orders/motor-parts',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'hover:border-emerald-300',
        },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <Header
                title="Inventory Orders"
                description="Select an inventory category to manage incoming purchase orders and customer fulfillment queues."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {orderStores.map((store) => {
                    const IconComponent = store.icon;
                    return (
                        <div
                            key={store.path}
                            onClick={() => navigate(store.path)}
                            className={`bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs cursor-pointer transition-all ${store.border} hover:shadow-md flex flex-col justify-between group`}
                        >
                            <div className="space-y-4">
                                <div className={`w-12 h-12 rounded-2xl ${store.bg} ${store.color} flex items-center justify-center`}>
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {store.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        {store.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                                <span>View Orders</span>
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrdersPage;