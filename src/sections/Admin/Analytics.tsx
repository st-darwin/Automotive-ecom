import { useEffect, useState, useMemo, useRef } from 'react';
import Header from "../../components/Header";
import { 
    TrendingUp, 
    DollarSign, 
    Clock, 
    ArrowUpRight,
    Activity,
    ShieldCheck,
    Users,
    FileText,
    X,
    ChevronLeft,
    ChevronRight
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
    tyreName?: string;
    amountPaid?: number;
    amountOwed?: number;
}

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [tyreOrders, setTyreOrders] = useState<GenericOrder[]>([]);
    const [greaseOrders, setGreaseOrders] = useState<GenericOrder[]>([]);
    const [motorPartsOrders, setMotorPartsOrders] = useState<GenericOrder[]>([]);
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

    // Modal state for viewing individual customer's debt transactions
    const [selectedDebtorCustomer, setSelectedDebtorCustomer] = useState<string | null>(null);

    // Slider reference for top metric cards
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
        let totalOutstandingDebt = 0;
        let totalCreditSales = 0;
        let creditCollected = 0;
        
        const customerDebtsMap: { [name: string]: { customerName: string; totalOwed: number; orders: GenericOrder[] } } = {};

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
            const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : (isPaid ? price : 0);
            const owed = order.amountOwed !== undefined ? Number(order.amountOwed) : Math.max(0, price - paid);

            totalRevenue += price;
            paidRevenue += paid;

            if (!isPaid && owed > 0) {
                totalOutstandingDebt += owed;
                totalCreditSales += price;
                creditCollected += paid;

                const custName = (order.customerName || 'Walk-in Customer').trim();
                if (!customerDebtsMap[custName]) {
                    customerDebtsMap[custName] = { customerName: custName, totalOwed: 0, orders: [] };
                }
                customerDebtsMap[custName].totalOwed += owed;
                customerDebtsMap[custName].orders.push(order);
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

        const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;
        const customerDebtList = Object.values(customerDebtsMap).sort((a, b) => b.totalOwed - a.totalOwed);

        const recentTransactions = [...allOrders]
            .sort((a, b) => new Date(b.$createdAt || '').getTime() - new Date(a.$createdAt || '').getTime())
            .slice(0, 5);

        return {
            totalRevenue,
            paidRevenue,
            totalOutstandingDebt,
            totalCreditSales,
            creditCollected,
            debtorsCount: customerDebtList.length,
            customerDebtList,
            totalCount,
            currentMonthRevenue,
            collectionRate,
            categoryCounts,
            recentTransactions
        };
    }, [tyreOrders, greaseOrders, motorPartsOrders, timeFilter]);

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Header
                    title="Store Analytics & Debt Insights"
                    description="Monitor financial performance, credit sales, debtor statistics, and collection health."
                />
                
                <div className="grid grid-cols-3 sm:flex items-center p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 w-full sm:w-auto">
                    <button onClick={() => setTimeFilter('all')} className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all text-center ${timeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>All Time</button>
                    <button onClick={() => setTimeFilter('month')} className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all text-center ${timeFilter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>This Month</button>
                    <button onClick={() => setTimeFilter('week')} className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all text-center ${timeFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>7 Days</button>
                </div>
            </div>

            {/* Top Metric Cards - Swipeable Slider on Mobile */}
            <div className="relative group">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center">
                    <button onClick={() => scrollSlider('left')} className="p-2 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                </div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center">
                    <button onClick={() => scrollSlider('right')} className="p-2 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>

                <div ref={sliderRef} className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-2 pt-1 px-1">
                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3 flex-shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Revenue</span>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : `₦${analyticsData.totalRevenue.toLocaleString()}`}</h3>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5" /> Combined store turnover</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3 flex-shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Outstanding Debt</span>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : `₦${analyticsData.totalOutstandingDebt.toLocaleString()}`}</h3>
                            <span className="text-[11px] text-amber-600 font-medium mt-1 block">Awaiting full customer settlement</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3 flex-shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Credit Sales & Collections</span>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{loading ? '...' : `₦${analyticsData.creditCollected.toLocaleString()}`} <span className="text-xs font-normal text-slate-500">/ ₦{analyticsData.totalCreditSales.toLocaleString()}</span></h3>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Collected / Total credit sales</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3 flex-shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Debtors Count</span>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : analyticsData.debtorsCount}</h3>
                            <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Customers with active debt</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customers with Active Debts Directory Table / Cards */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Customers with Active Debts</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Aggregated list of customers carrying outstanding credit balances.</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                        {loading ? '...' : `${analyticsData.customerDebtList.length} Active Debtors`}
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-400 text-xs">Loading active debtors...</div>
                ) : analyticsData.customerDebtList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                        No active debtors found. All credit sales have been fully paid!
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3 px-4">Customer Name</th>
                                        <th className="py-3 px-4">Unpaid Transactions</th>
                                        <th className="py-3 px-4">Combined Outstanding Debt</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                    {analyticsData.customerDebtList.map((debtor) => (
                                        <tr key={debtor.customerName} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                                                {debtor.customerName}
                                            </td>
                                            <td className="py-4 px-4 font-semibold text-slate-600">
                                                {debtor.orders.length} order{debtor.orders.length > 1 ? 's' : ''}
                                            </td>
                                            <td className="py-4 px-4 font-black text-rose-600 text-sm">
                                                ₦{debtor.totalOwed.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => setSelectedDebtorCustomer(debtor.customerName)}
                                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>View Transactions</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Stacked Cards View */}
                        <div className="grid grid-cols-1 gap-3 sm:hidden">
                            {analyticsData.customerDebtList.map((debtor) => (
                                <div key={debtor.customerName} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900 text-sm">{debtor.customerName}</h4>
                                        <p className="text-[11px] text-slate-500">{debtor.orders.length} unpaid order{debtor.orders.length > 1 ? 's' : ''}</p>
                                        <p className="text-xs font-black text-rose-600">Owed: ₦{debtor.totalOwed.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDebtorCustomer(debtor.customerName)}
                                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Financial Health Monitor */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-blue-400 shrink-0">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base">Financial & Debt Liquidity Monitor</h4>
                            <p className="text-xs text-slate-400">Payment conversion and store receivables tracking</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
                        <ShieldCheck className="w-4 h-4" /> Healthy
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 z-10 pt-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                        <span className="text-xs text-slate-400 font-medium">Payment Collection Efficiency</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold">{loading ? '...' : `${analyticsData.collectionRate}%`}</span>
                            <span className="text-[11px] text-emerald-400 font-semibold">Collected vs Total</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${analyticsData.collectionRate}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                        <span className="text-xs text-slate-400 font-medium">Total Credit Exposure</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-amber-400">{loading ? '...' : `₦${analyticsData.totalOutstandingDebt.toLocaleString()}`}</span>
                            <span className="text-[11px] text-amber-400 font-semibold">Unsettled Balances</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Individual Customer Debt Breakdown Modal */}
            {selectedDebtorCustomer && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">Customer Debt Transactions</h3>
                                <p className="text-xs text-slate-500">Debtor Profile: <span className="font-bold text-slate-800">{selectedDebtorCustomer}</span></p>
                            </div>
                            <button onClick={() => setSelectedDebtorCustomer(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            {analyticsData.customerDebtList.find(c => c.customerName === selectedDebtorCustomer)?.orders.map(order => {
                                const total = Number(order.totalPrice || 0);
                                const paid = Number(order.amountPaid || 0);
                                const owed = Number(order.amountOwed !== undefined && order.amountOwed !== null ? order.amountOwed : Math.max(0, total - paid));
                                return (
                                    <div key={order.$id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-900">{order.tyreName || order.itemType || 'Product'} — <span className="text-slate-500 font-normal">{order.brand || order.category || ''}</span></p>
                                            <p className="text-[10px] text-slate-400">Date: {new Date(order.$createdAt || '').toLocaleDateString()} | Qty: {order.quantity || 1}</p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs font-bold text-slate-900">Total: ₦{total.toLocaleString()}</p>
                                                <p className="text-xs font-black text-rose-600">Owed: ₦{owed.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;