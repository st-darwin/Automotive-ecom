import { useEffect, useState, useMemo } from 'react';
import Header from "../../components/Header";
import { 
    TrendingUp, 
    DollarSign, 
    ShoppingBag, 
    Clock, 
    Droplet, 
    Wrench, 
    CircleDot,
    ArrowUpRight,
    Activity,
    ShieldCheck,
    CreditCard,
    Layers,
    Sparkles
} from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface GenericOrder {
    $id: string;
    $createdAt: string;
    totalPrice: number;
    paymentStatus?: string;
    quantity?: number;
    brand?: string;
    category?: string;
    itemType?: string; 
    customerName?: string;
}

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [tyreOrders, setTyreOrders] = useState<GenericOrder[]>([]);
    const [greaseOrders, setGreaseOrders] = useState<GenericOrder[]>([]);
    const [motorPartsOrders, setMotorPartsOrders] = useState<GenericOrder[]>([]);
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

    useEffect(() => {
        const fetchAllAnalyticsData = async () => {
            try {
                setLoading(true);
                const [tyresRes, greaseRes, partsRes] = await Promise.all([
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.tyreOrdersCollecton),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.greaseOrdersCollection),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.motorPartsOrdersCollection),
                ]);

                setTyreOrders(tyresRes.documents as unknown as GenericOrder[]);
                setGreaseOrders(greaseRes.documents as unknown as GenericOrder[]);
                setMotorPartsOrders(partsRes.documents as unknown as GenericOrder[]);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllAnalyticsData();
    }, []);

    const analyticsData = useMemo(() => {
        const allOrders = [
            ...tyreOrders.map(o => ({ ...o, source: 'Tyres' })),
            ...greaseOrders.map(o => ({ ...o, source: 'Grease' })),
            ...motorPartsOrders.map(o => ({ ...o, source: 'Motor Parts' })),
        ];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);

        // Filter orders based on active selection
        const filteredOrders = allOrders.filter(order => {
            if (!order.$createdAt) return true;
            const orderDate = new Date(order.$createdAt);
            if (timeFilter === 'month') {
                return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
            }
            if (timeFilter === 'week') {
                return orderDate >= oneWeekAgo;
            }
            return true;
        });

        let totalRevenue = 0;
        let paidRevenue = 0;
        let pendingRevenue = 0;
        let totalCount = filteredOrders.length;
        
        const categoryCounts: { [key: string]: { count: number; revenue: number } } = {
            'Tyres': { count: 0, revenue: 0 },
            'Grease': { count: 0, revenue: 0 },
            'Motor Parts': { count: 0, revenue: 0 },
        };

        let currentMonthRevenue = 0;

        filteredOrders.forEach(order => {
            const price = Number(order.totalPrice) || 0;
            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';

            totalRevenue += price;
            if (isPaid) {
                paidRevenue += price;
            } else {
                pendingRevenue += price;
            }

            if (categoryCounts[order.source]) {
                categoryCounts[order.source].count += 1;
                categoryCounts[order.source].revenue += price;
            }

            if (order.$createdAt) {
                const orderDate = new Date(order.$createdAt);
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    currentMonthRevenue += price;
                }
            }
        });

        // Collection Health Rate Calculation
        const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

        // Sort recent high value transactions
        const recentTransactions = [...allOrders]
            .sort((a, b) => new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime())
            .slice(0, 5);

        return {
            totalRevenue,
            paidRevenue,
            pendingRevenue,
            totalCount,
            currentMonthRevenue,
            collectionRate,
            categoryCounts,
            recentTransactions
        };
    }, [tyreOrders, greaseOrders, motorPartsOrders, timeFilter]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Header
                    title="Store Analytics & Insights"
                    description="Monitor financial performance, inventory sales distribution, and collection health."
                />
                
                {/* Time Frame Switcher */}
                <div className="flex items-center p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                    <button
                        onClick={() => setTimeFilter('all')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                            timeFilter === 'all' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => setTimeFilter('month')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                            timeFilter === 'month' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setTimeFilter('week')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                            timeFilter === 'week' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Last 7 Days
                    </button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-3 relative overflow-hidden group hover:border-blue-300 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-all"></div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Revenue</span>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : `₦${analyticsData.totalRevenue.toLocaleString()}`}
                        </h3>
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Combined store turnover
                        </span>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-2xl group-hover:bg-emerald-400/10 transition-all"></div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Collected Revenue</span>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : `₦${analyticsData.paidRevenue.toLocaleString()}`}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium mt-1 block">Successfully paid orders</span>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl group-hover:bg-amber-400/10 transition-all"></div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pending Receivables</span>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : `₦${analyticsData.pendingRevenue.toLocaleString()}`}
                        </h3>
                        <span className="text-[11px] text-amber-600 font-medium mt-1 block">Awaiting payment settlement</span>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-3 relative overflow-hidden group hover:border-indigo-300 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/5 rounded-full blur-2xl group-hover:bg-indigo-400/10 transition-all"></div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Current Month Sales</span>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : `₦${analyticsData.currentMonthRevenue.toLocaleString()}`}
                        </h3>
                        <span className="text-[11px] text-indigo-600 font-medium mt-1 block">This calendar month</span>
                    </div>
                </div>
            </div>

            {/* Store Health & Metrics Ribbon */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-7 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-blue-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base">Financial Health Monitor</h4>
                                <p className="text-xs text-slate-400">Payment conversion and store liquidity tracking</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Healthy
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 z-10 pt-2">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                            <span className="text-xs text-slate-400 font-medium">Payment Collection Efficiency</span>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold">{loading ? '...' : `${analyticsData.collectionRate}%`}</span>
                                <span className="text-[11px] text-emerald-400 font-semibold">Paid vs Total</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${analyticsData.collectionRate}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                            <span className="text-xs text-slate-400 font-medium">Average Order Value (AOV)</span>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold">
                                    {loading || analyticsData.totalCount === 0 
                                        ? '₦0' 
                                        : `₦${Math.round(analyticsData.totalRevenue / analyticsData.totalCount).toLocaleString()}`}
                                </span>
                                <span className="text-[11px] text-blue-400 font-semibold">Per transaction</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full rounded-full w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Summary Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Quick Breakdown</h4>
                            <p className="text-xs text-slate-500">Active operational volume</p>
                        </div>
                    </div>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 border-b border-slate-100 pb-2.5">
                            <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Total Orders Logged</span>
                            <span className="font-bold text-slate-900">{loading ? '...' : analyticsData.totalCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 border-b border-slate-100 pb-2.5">
                            <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-400" /> Fully Settled</span>
                            <span className="font-bold text-emerald-600">{loading ? '...' : `₦${analyticsData.paidRevenue.toLocaleString()}`}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 pb-1">
                            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Awaiting Settlement</span>
                            <span className="font-bold text-amber-600">{loading ? '...' : `₦${analyticsData.pendingRevenue.toLocaleString()}`}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <span className="text-[11px] text-slate-500 font-medium block">Store currency in Nigerian Naira (₦)</span>
                    </div>
                </div>
            </div>

            {/* Breakdown by Product Category */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Category Performance Breakdown</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Sales volume and revenue generated per automotive department.</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
                        {loading ? '...' : `${analyticsData.totalCount} Filtered Entries`}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tyres Category */}
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 space-y-4 hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <CircleDot className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-900 text-sm">Tyres</span>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                {loading ? '...' : `${analyticsData.categoryCounts['Tyres'].count} orders`}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Department Revenue</span>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">
                                {loading ? '...' : `₦${analyticsData.categoryCounts['Tyres'].revenue.toLocaleString()}`}
                            </h4>
                        </div>
                    </div>

                    {/* Grease Category */}
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 space-y-4 hover:border-amber-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <Droplet className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-900 text-sm">Grease & Lubricants</span>
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                {loading ? '...' : `${analyticsData.categoryCounts['Grease'].count} orders`}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Department Revenue</span>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">
                                {loading ? '...' : `₦${analyticsData.categoryCounts['Grease'].revenue.toLocaleString()}`}
                            </h4>
                        </div>
                    </div>

                    {/* Motor Parts Category */}
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 space-y-4 hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-900 text-sm">Motor Parts</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                {loading ? '...' : `${analyticsData.categoryCounts['Motor Parts'].count} orders`}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Department Revenue</span>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">
                                {loading ? '...' : `₦${analyticsData.categoryCounts['Motor Parts'].revenue.toLocaleString()}`}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Transactions Section */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Recent Store Transactions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Latest order activities recorded across all departments.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="pb-3 pl-2">Department</th>
                                <th className="pb-3">Customer / Identifier</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right pr-2">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400">Loading recent transactions...</td>
                                </tr>
                            ) : analyticsData.recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400">No transactions recorded yet.</td>
                                </tr>
                            ) : (
                                analyticsData.recentTransactions.map((tx) => {
                                    const isPaid = tx.paymentStatus?.toLowerCase() === 'paid';
                                    return (
                                        <tr key={tx.$id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 pl-2 font-bold text-slate-900 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    tx.source === 'Tyres' ? 'bg-blue-500' : tx.source === 'Grease' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></span>
                                                {tx.source}
                                            </td>
                                            <td className="py-3.5 text-slate-600">
                                                {tx.customerName || tx.brand || tx.itemType || 'Walk-in Customer'}
                                            </td>
                                            <td className="py-3.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                    isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {tx.paymentStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-right pr-2 font-bold text-slate-900">
                                                ₦{Number(tx.totalPrice || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;