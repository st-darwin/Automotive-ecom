import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Search } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';
import Header from '../../components/Header';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'pending'>('all');

    const fetchAllNotifications = async () => {
        setLoading(true);
        try {
            const response = await database.listDocuments(
                appwriteConfig.databaseId, 
                appwriteConfig.adminNotificationsCollection || 'admin-notifications'
            );
            
            const sorted = response.documents.sort((a: any, b: any) => 
                new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
            );
            
            setNotifications(sorted);
        } catch (error) {
            console.error("Error fetching all notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllNotifications();
    }, []);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(item => {
            const customer = (item.customerName || '').toLowerCase();
            const product = (item.productName || item.tyreName || item.partName || item.greaseName || '').toLowerCase();
            const query = searchTerm.toLowerCase();
            
            const matchesSearch = customer.includes(query) || product.includes(query);

            if (selectedFilter === 'paid') {
                return matchesSearch && (item.paymentStatus || '').toLowerCase() === 'paid';
            }
            if (selectedFilter === 'pending') {
                return matchesSearch && ((item.paymentStatus || '').toLowerCase() === 'pending' || !item.paymentStatus);
            }
            return matchesSearch;
        });
    }, [notifications, searchTerm, selectedFilter]);

    const handleItemClick = (item: any) => {
        const type = (item.productType || '').toLowerCase().trim();

        if (type === 'tyres' || type === 'tyre') {
            navigate('/orders/tyres');
        } else if (type === 'motorparts' || type === 'motor-parts' || type === 'parts') {
            navigate('/orders/motor-parts');
        } else if (type === 'grease') {
            navigate('/orders/grease');
        } else {
            navigate('/orders');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Header 
                title="All Notifications" 
                description="Chronological history of admin activity & store orders"
                ctaText="View Orders"
                ctaUrl="/orders"
            />

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search customer or product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                        {(['all', 'paid', 'pending'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                                    selectedFilter === filter 
                                        ? 'bg-white text-slate-900 shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-16 bg-slate-100/80 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter criteria.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        <div className="pb-3 flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                            <span>Recent activity logs</span>
                            <span>Showing chronological logs</span>
                        </div>

                        {filteredNotifications.map((item) => {
                            const isPaid = (item.paymentStatus || '').toLowerCase() === 'paid';

                            return (
                                <div 
                                    key={item.$id} 
                                    onClick={() => handleItemClick(item)}
                                    className="py-4 first:pt-4 last:pb-0 flex items-start gap-4 transition-all rounded-2xl px-3 hover:bg-slate-50/80 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 mt-1 shrink-0">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">
                                                {item.customerName || 'Customer Order'}
                                            </h4>
                                            <span className="text-[11px] font-medium text-slate-400 shrink-0">
                                                {new Date(item.$createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                                            Ordered <span className="font-semibold text-slate-800">{item.productName || item.tyreName || item.partName || 'Product'}</span>
                                        </p>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            {item.totalPrice ? (
                                                <p className="text-xs font-bold text-emerald-600">
                                                    ₦{item.totalPrice.toLocaleString()}
                                                </p>
                                            ) : <span />}

                                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                                                isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                                {item.paymentStatus || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;