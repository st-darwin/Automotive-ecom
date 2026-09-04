import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
    ArrowLeft, 
    Droplet, 
    ShoppingBag, 
    Calendar, 
    MoreVertical, 
    Trash2, 
    Clock, 
    Wallet, 
    Search, 
    Check,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface GreaseOrder {
    $id: string;
    $createdAt: string;
    customerName: string;
    greaseName: string;
    brand: string;
    volume: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    paymentStatus: string;
    paymentDate?: string;
}

type TabType = 'all' | 'paid' | 'pending';

const GreaseOrder = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<GreaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const sliderRef = useRef<HTMLDivElement>(null);

    const scrollSlider = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const { scrollLeft, clientWidth } = sliderRef.current;
            const scrollAmount = clientWidth * 0.75;
            sliderRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.greaseOrdersCollection
            );
            setOrders(response.documents as unknown as GreaseOrder[]);
        } catch (error) {
            console.error('Error fetching grease orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this grease order record?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.greaseOrdersCollection,
                id
            );
            setOrders(prev => prev.filter(o => o.$id !== id));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting grease order:', error);
        }
    };

    const handleStatusToggle = async (order: GreaseOrder, e: React.MouseEvent) => {
        e.stopPropagation();
        const isCurrentlyPaid = order.paymentStatus?.toLowerCase() === 'paid';
        const newStatus = isCurrentlyPaid ? 'pending' : 'paid';
        const currentDate = new Date().toISOString();
        
        try {
            setUpdatingId(order.$id);
            await database.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.greaseOrdersCollection,
                order.$id,
                { 
                    paymentStatus: newStatus,
                    paymentDate: !isCurrentlyPaid ? currentDate : null 
                }
            );
            setOrders(prev => prev.map(o => o.$id === order.$id ? { ...o, paymentStatus: newStatus, paymentDate: !isCurrentlyPaid ? currentDate : undefined } : o));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error updating payment status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const metrics = useMemo(() => {
        const totalOrdersCount = orders.length;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let currentMonthOrdersCount = 0;
        let totalRevenue = 0;
        let currentMonthRevenue = 0;
        let pendingCount = 0;
        let pendingAmount = 0;

        orders.forEach(order => {
            const price = Number(order.totalPrice) || 0;
            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';

            totalRevenue += price;

            if (!isPaid) {
                pendingCount += 1;
                pendingAmount += price;
            }

            if (order.$createdAt) {
                const orderDate = new Date(order.$createdAt);
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    currentMonthOrdersCount += 1;
                    currentMonthRevenue += price;
                }
            }
        });

        return {
            totalOrdersCount,
            currentMonthOrdersCount,
            totalRevenue,
            currentMonthRevenue,
            pendingCount,
            pendingAmount
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        const filtered = orders.filter(order => {
            const matchesTab = 
                activeTab === 'all' ? true :
                activeTab === 'paid' ? order.paymentStatus?.toLowerCase() === 'paid' :
                order.paymentStatus?.toLowerCase() !== 'paid';

            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                !searchQuery ||
                order.customerName?.toLowerCase().includes(query) ||
                order.greaseName?.toLowerCase().includes(query) ||
                order.brand?.toLowerCase().includes(query) ||
                order.volume?.toLowerCase().includes(query);

            return matchesTab && matchesSearch;
        });

        return filtered.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    }, [orders, activeTab, searchQuery]);

    const groupedOrdersByCategory = useMemo(() => {
        const groups: { [key: string]: GreaseOrder[] } = {
            'Today': [],
            'Yesterday': [],
            'Older': []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        filteredOrders.forEach(order => {
            if (!order.$createdAt) {
                groups['Older'].push(order);
                return;
            }

            const orderDate = new Date(order.$createdAt);
            const orderDateNormalized = new Date(orderDate);
            orderDateNormalized.setHours(0, 0, 0, 0);

            if (orderDateNormalized.getTime() === today.getTime()) {
                groups['Today'].push(order);
            } else if (orderDateNormalized.getTime() === yesterday.getTime()) {
                groups['Yesterday'].push(order);
            } else {
                groups['Older'].push(order);
            }
        });

        return Object.fromEntries(Object.entries(groups).filter(([_, list]) => list.length > 0));
    }, [filteredOrders]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <Header
                    title="Grease Orders Management"
                    description="Track walk-in lubricant purchases, container sizes, pricing, and payment timelines."
                />
            </div>

            {/* Metrics Overview Carousel */}
            <div className="relative group">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center">
                    <button onClick={() => scrollSlider('left')} className="p-2 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center">
                    <button onClick={() => scrollSlider('right')} className="p-2 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div ref={sliderRef} className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-2 pt-1 px-1">
                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Total Orders</span>
                            <h3 className="text-xl font-bold text-slate-900">{loading ? '...' : metrics.totalOrdersCount}</h3>
                            <span className="text-[10px] text-emerald-600 font-medium">{metrics.currentMonthOrdersCount} this month</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Pending Payments</span>
                            <h3 className="text-xl font-bold text-slate-900">{loading ? '...' : metrics.pendingCount} <span className="text-xs font-normal text-slate-500">orders</span></h3>
                            <span className="text-[10px] font-semibold text-amber-600">₦{metrics.pendingAmount.toLocaleString()} owed</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Total Revenue</span>
                            <h3 className="text-xl font-bold text-slate-900">₦{loading ? '...' : metrics.totalRevenue.toLocaleString()}</h3>
                            <span className="text-[10px] text-slate-400">All-time sales</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Month Revenue</span>
                            <h3 className="text-xl font-bold text-slate-900">₦{loading ? '...' : metrics.currentMonthRevenue.toLocaleString()}</h3>
                            <span className="text-[10px] text-indigo-600 font-medium">Current calendar month</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls: Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl p-3 border border-slate-200/60 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto">
                    {(['all', 'paid', 'pending'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search customer, brand, grease..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Orders Content Section */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-16 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Droplet className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-semibold text-slate-900">No grease orders found</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            {searchQuery ? 'Try adjusting your search criteria or filters.' : 'Walk-in customer lubricant transactions and purchase records will appear here once logged.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedOrdersByCategory).map(([categoryLabel, dateOrders]) => (
                        <div key={categoryLabel} className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">{categoryLabel}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/60">
                                    {dateOrders.length} {dateOrders.length === 1 ? 'order' : 'orders'}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[750px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3 px-6">Customer Name</th>
                                            <th className="py-3 px-6">Grease / Brand</th>
                                            <th className="py-3 px-6">Volume</th>
                                            <th className="py-3 px-6">Qty</th>
                                            <th className="py-3 px-6">Total Price</th>
                                            <th className="py-3 px-6">Payment Status & Date</th>
                                            <th className="py-3 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                        {dateOrders.map((order) => {
                                            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
                                            const formattedCreatedAt = order.$createdAt 
                                                ? new Date(order.$createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                                : null;
                                            const formattedPaymentDate = order.paymentDate 
                                                ? new Date(order.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                                : null;

                                            return (
                                                <tr key={order.$id} className="hover:bg-slate-50/60 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-slate-900">{order.customerName}</p>
                                                            {formattedCreatedAt && <p className="text-[10px] text-slate-400 font-normal">{formattedCreatedAt}</p>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-0.5">
                                                            <p className="text-slate-900 font-semibold">{order.greaseName}</p>
                                                            <span className="text-[11px] text-slate-400">{order.brand}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-slate-600">{order.volume}</td>
                                                    <td className="py-4 px-6 font-semibold text-slate-900">{order.quantity}</td>
                                                    <td className="py-4 px-6 font-bold text-slate-900">₦{order.totalPrice?.toLocaleString()}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-1">
                                                            <button
                                                                onClick={(e) => handleStatusToggle(order, e)}
                                                                disabled={updatingId === order.$id}
                                                                title="Click to toggle status"
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer hover:opacity-80 ${
                                                                    isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                                                                }`}
                                                            >
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                {updatingId === order.$id ? 'Updating...' : (order.paymentStatus || 'Pending')}
                                                            </button>
                                                            {isPaid && formattedPaymentDate && (
                                                                <p className="text-[10px] text-emerald-600 font-medium">Paid on: {formattedPaymentDate}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right relative" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdown(activeDropdown === order.$id ? null : order.$id);
                                                            }}
                                                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {activeDropdown === order.$id && (
                                                            <div className="absolute right-6 top-14 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                                <button
                                                                    onClick={(e) => handleStatusToggle(order, e)}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                                                >
                                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                    <span>Mark as {isPaid ? 'Pending' : 'Paid'}</span>
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-1" />
                                                                <button
                                                                    onClick={(e) => handleDelete(order.$id, e)}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                                    <span>Delete Record</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GreaseOrder;