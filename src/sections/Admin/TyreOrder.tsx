import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
    ArrowLeft, 
    CircleDot, 
    ShoppingBag, 
    Calendar, 
    MoreVertical, 
    Trash2, 
    Clock, 
    Wallet, 
    Search, 
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    Users,
    X,
    PlusCircle
} from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface TyreOrder {
    $id: string;
    $createdAt: string;
    customerName: string;
    tyreName: string;
    brand: string;
    size: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    paymentStatus: string;
    paymentDate?: string;
    amountPaid?: number;
    amountOwed?: number;
}

type TabType = 'all' | 'paid' | 'pending' | 'debts';

const TyreOrderComponent = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<TyreOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Modal state for recording subsequent payments
    const [paymentModalOrder, setPaymentModalOrder] = useState<TyreOrder | null>(null);
    const [subsequentAmount, setSubsequentAmount] = useState<number | ''>('');
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    // Modal state for viewing customer debt profile
    const [debtModalCustomer, setDebtModalCustomer] = useState<string | null>(null);

    const sliderRef = React.useRef<HTMLDivElement>(null);

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
                appwriteConfig.tyreOrdersCollecton
            );
            setOrders(response.documents as unknown as TyreOrder[]);
        } catch (error) {
            console.error('Error fetching tyre orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this order record?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.tyreOrdersCollecton,
                id
            );
            setOrders(prev => prev.filter(o => o.$id !== id));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting tyre order:', error);
        }
    };

    const handleRecordSubsequentPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModalOrder || subsequentAmount === '') return;

        const currentPaid = paymentModalOrder.amountPaid !== undefined 
            ? paymentModalOrder.amountPaid 
            : (paymentModalOrder.paymentStatus?.toLowerCase() === 'paid' ? paymentModalOrder.totalPrice : 0);
            
        const currentOwed = paymentModalOrder.amountOwed !== undefined 
            ? paymentModalOrder.amountOwed 
            : Math.max(0, paymentModalOrder.totalPrice - currentPaid);

        const paymentNum = Number(subsequentAmount);

        if (paymentNum <= 0 || paymentNum > currentOwed) {
            alert("Invalid payment amount. It must be greater than 0 and cannot exceed the outstanding balance.");
            return;
        }

        const newAmountPaid = currentPaid + paymentNum;
        const newAmountOwed = Math.max(0, paymentModalOrder.totalPrice - newAmountPaid);
        const newStatus = newAmountOwed === 0 ? 'paid' : 'pending';
        const currentDate = new Date().toISOString();

        try {
            setPaymentSubmitting(true);
            await database.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.tyreOrdersCollecton,
                paymentModalOrder.$id,
                {
                    amountPaid: newAmountPaid,
                    amountOwed: newAmountOwed,
                    paymentStatus: newStatus,
                    paymentDate: newStatus === 'paid' ? currentDate : paymentModalOrder.paymentDate
                }
            );

            setOrders(prev => prev.map(o => o.$id === paymentModalOrder.$id ? {
                ...o,
                amountPaid: newAmountPaid,
                amountOwed: newAmountOwed,
                paymentStatus: newStatus,
                paymentDate: newStatus === 'paid' ? currentDate : o.paymentDate
            } : o));

            setPaymentModalOrder(null);
            setSubsequentAmount('');
        } catch (error) {
            console.error('Error recording subsequent payment:', error);
            alert('Failed to update payment record.');
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const handleStatusToggle = async (order: TyreOrder, e: React.MouseEvent) => {
        e.stopPropagation();
        const isCurrentlyPaid = order.paymentStatus?.toLowerCase() === 'paid';
        const newStatus = isCurrentlyPaid ? 'pending' : 'paid';
        const newPaid = isCurrentlyPaid ? 0 : order.totalPrice;
        const newOwed = isCurrentlyPaid ? order.totalPrice : 0;
        const currentDate = new Date().toISOString();
        
        try {
            setUpdatingId(order.$id);
            await database.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.tyreOrdersCollecton,
                order.$id,
                { 
                    paymentStatus: newStatus,
                    amountPaid: newPaid,
                    amountOwed: newOwed,
                    paymentDate: !isCurrentlyPaid ? currentDate : null 
                }
            );
            setOrders(prev => prev.map(o => o.$id === order.$id ? { 
                ...o, 
                paymentStatus: newStatus, 
                amountPaid: newPaid,
                amountOwed: newOwed,
                paymentDate: !isCurrentlyPaid ? currentDate : undefined 
            } : o));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error updating payment status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleViewReceipt = (order: TyreOrder, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/receipt', { 
            state: { 
                type: 'tyres',
                createdAt: order.$createdAt,
                order 
            } 
        });
    };

    // Tyre Revenue & Metrics calculations including Debt metrics
    const metrics = useMemo(() => {
        const totalOrdersCount = orders.length;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let currentMonthOrdersCount = 0;
        let totalTyreRevenue = 0;
        let currentMonthTyreRevenue = 0;
        let pendingCount = 0;
        let totalOutstandingDebt = 0;

        const customerDebtsMap: { [name: string]: number } = {};

        orders.forEach(order => {
            const price = Number(order.totalPrice) || 0;
            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
            const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : (isPaid ? price : 0);
            const owed = order.amountOwed !== undefined ? Number(order.amountOwed) : Math.max(0, price - paid);

            totalTyreRevenue += price;

            if (!isPaid && owed > 0) {
                pendingCount += 1;
                totalOutstandingDebt += owed;
                const custName = (order.customerName || 'Unknown').trim();
                customerDebtsMap[custName] = (customerDebtsMap[custName] || 0) + owed;
            }

            if (order.$createdAt) {
                const orderDate = new Date(order.$createdAt);
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    currentMonthOrdersCount += 1;
                    currentMonthTyreRevenue += price;
                }
            }
        });

        return {
            totalOrdersCount,
            currentMonthOrdersCount,
            totalTyreRevenue,
            currentMonthTyreRevenue,
            pendingCount,
            totalOutstandingDebt,
            uniqueDebtorsCount: Object.keys(customerDebtsMap).length,
            customerDebtsMap
        };
    }, [orders]);

    // Group unpaid transactions by customer for the "Debts" tab
    const customerDebtList = useMemo(() => {
        const map: { [name: string]: { customerName: string; totalOwed: number; orders: TyreOrder[] } } = {};

        orders.forEach(order => {
            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
            const price = Number(order.totalPrice) || 0;
            const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : (isPaid ? price : 0);
            const owed = order.amountOwed !== undefined ? Number(order.amountOwed) : Math.max(0, price - paid);

            if (!isPaid && owed > 0) {
                const name = order.customerName || 'Unknown Customer';
                if (!map[name]) {
                    map[name] = { customerName: name, totalOwed: 0, orders: [] };
                }
                map[name].totalOwed += owed;
                map[name].orders.push(order);
            }
        });

        return Object.values(map).sort((a, b) => b.totalOwed - a.totalOwed);
    }, [orders]);

    // Filtered orders based on active tab and search query
    const filteredOrders = useMemo(() => {
        const filtered = orders.filter(order => {
            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
            const matchesTab = 
                activeTab === 'all' ? true :
                activeTab === 'paid' ? isPaid :
                activeTab === 'pending' ? !isPaid : true;

            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                !searchQuery ||
                order.customerName?.toLowerCase().includes(query) ||
                order.tyreName?.toLowerCase().includes(query) ||
                order.brand?.toLowerCase().includes(query) ||
                order.size?.toLowerCase().includes(query);

            return matchesTab && matchesSearch;
        });

        return filtered.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    }, [orders, activeTab, searchQuery]);

    const groupedOrdersByCategory = useMemo(() => {
        const groups: { [key: string]: TyreOrder[] } = {
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
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="p-2 sm:p-2.5 rounded-xl bg-white/85 border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <Header
                    title="Tyre Orders & Debt Management"
                    description="Track customer purchases, credit balances, partial payments, and settlements."
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

                <div ref={sliderRef} className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-2 pt-1 px-1">
                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Total Orders</span>
                            <h3 className="text-xl font-bold text-slate-900">{loading ? '...' : metrics.totalOrdersCount}</h3>
                            <span className="text-[10px] text-emerald-600 font-medium">{metrics.currentMonthOrdersCount} this month</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Outstanding Debt</span>
                            <h3 className="text-xl font-bold text-slate-900">₦{loading ? '...' : metrics.totalOutstandingDebt.toLocaleString()}</h3>
                            <span className="text-[10px] font-semibold text-amber-600">{metrics.uniqueDebtorsCount} debtor{metrics.uniqueDebtorsCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Tyre Revenue</span>
                            <h3 className="text-xl font-bold text-slate-900">₦{loading ? '...' : metrics.totalTyreRevenue.toLocaleString()}</h3>
                            <span className="text-[10px] text-slate-400">All-time tyre sales</span>
                        </div>
                    </div>

                    <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Active Debtors</span>
                            <h3 className="text-xl font-bold text-slate-900">{loading ? '...' : metrics.uniqueDebtorsCount}</h3>
                            <span className="text-[10px] text-indigo-600 font-medium">Customers owing balances</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls: Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/60 backdrop-blur-xl p-3 border border-slate-200/60 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto scrollbar-none">
                    {(['all', 'paid', 'pending', 'debts'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === tab
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab === 'debts' ? 'Customer Debts' : tab}
                        </button>
                    ))}
                </div>

                {activeTab !== 'debts' && (
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search customer, brand, tyre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Conditional Rendering based on Tab */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : activeTab === 'debts' ? (
                /* Customer Debts Grouped View */
                customerDebtList.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <Check className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 max-w-sm mx-auto">
                            <h3 className="text-base font-semibold text-slate-900">No outstanding customer debts</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">All credit transactions have been fully settled.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                            <div className="bg-slate-50/90 px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Customers with Outstanding Balances</h3>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 self-start sm:self-auto">
                                    Total Debt: ₦{metrics.totalOutstandingDebt.toLocaleString()}
                                </span>
                            </div>
                            
                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3 px-6">Customer Name</th>
                                            <th className="py-3 px-6">Unpaid Orders Count</th>
                                            <th className="py-3 px-6">Combined Outstanding Debt</th>
                                            <th className="py-3 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                        {customerDebtList.map((debtor) => (
                                            <tr key={debtor.customerName} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                                                    {debtor.customerName}
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">
                                                    {debtor.orders.length} transaction{debtor.orders.length > 1 ? 's' : ''}
                                                </td>
                                                <td className="py-4 px-6 font-black text-rose-600 text-sm">
                                                    ₦{debtor.totalOwed.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => setDebtModalCustomer(debtor.customerName)}
                                                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                                    >
                                                        <span>View Transactions</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Stacked List Cards View */}
                            <div className="divide-y divide-slate-100 sm:hidden">
                                {customerDebtList.map((debtor) => (
                                    <div key={debtor.customerName} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{debtor.customerName}</h4>
                                                <p className="text-[11px] text-slate-500">{debtor.orders.length} unpaid transaction{debtor.orders.length > 1 ? 's' : ''}</p>
                                            </div>
                                            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                                                ₦{debtor.totalOwed.toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setDebtModalCustomer(debtor.customerName)}
                                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>View Transactions & Pay</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <CircleDot className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-semibold text-slate-900">No tyre orders found</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            {searchQuery ? 'Try adjusting your search criteria or filters.' : 'Walk-in customer transactions and purchase records will appear here once logged.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedOrdersByCategory).map(([categoryLabel, dateOrders]) => (
                        <div key={categoryLabel} className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                            <div className="bg-slate-50/80 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">{categoryLabel}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/60">
                                    {dateOrders.length} {dateOrders.length === 1 ? 'order' : 'orders'}
                                </span>
                            </div>

                            {/* Responsive Table Container */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3 px-6">Customer Name</th>
                                            <th className="py-3 px-6">Tyre / Brand</th>
                                            <th className="py-3 px-6">Qty & Price</th>
                                            <th className="py-3 px-6">Paid / Owed</th>
                                            <th className="py-3 px-6">Payment Status</th>
                                            <th className="py-3 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                        {dateOrders.map((order) => {
                                            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
                                            const paid = order.amountPaid !== undefined ? order.amountPaid : (isPaid ? order.totalPrice : 0);
                                            const owed = order.amountOwed !== undefined ? order.amountOwed : Math.max(0, order.totalPrice - paid);
                                            
                                            const formattedCreatedAt = order.$createdAt 
                                                ? new Date(order.$createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
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
                                                            <p className="text-slate-900 font-semibold">{order.tyreName}</p>
                                                            <span className="text-[11px] text-slate-400">{order.brand} ({order.size})</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-slate-900">₦{order.totalPrice?.toLocaleString()}</p>
                                                            <span className="text-[11px] text-slate-400">Qty: {order.quantity}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-emerald-600">Paid: ₦{paid.toLocaleString()}</p>
                                                            {owed > 0 && <p className="font-bold text-rose-600">Owed: ₦{owed.toLocaleString()}</p>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                            isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                            {order.paymentStatus || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right relative" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {owed > 0 && (
                                                                <button
                                                                    onClick={() => setPaymentModalOrder(order)}
                                                                    title="Add Payment"
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-200/60"
                                                                >
                                                                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                                    <span>Pay Balance</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleViewReceipt(order, e)}
                                                                title="View Receipt"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                                                            >
                                                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>Receipt</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveDropdown(activeDropdown === order.$id ? null : order.$id);
                                                                }}
                                                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {activeDropdown === order.$id && (
                                                            <div className="absolute right-6 top-14 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                                <button
                                                                    onClick={(e) => handleViewReceipt(order, e)}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                                                >
                                                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>View Receipt</span>
                                                                </button>
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

            {/* Subsequent Payment Modal */}
            {paymentModalOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Record Subsequent Payment</h3>
                                <p className="text-xs text-slate-500">Customer: <span className="font-bold text-slate-700">{paymentModalOrder.customerName}</span></p>
                            </div>
                            <button onClick={() => setPaymentModalOrder(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex justify-between text-xs"><span className="text-slate-500">Product:</span><span className="font-bold text-slate-800">{paymentModalOrder.tyreName}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-slate-500">Total Price:</span><span className="font-bold text-slate-900">₦{paymentModalOrder.totalPrice.toLocaleString()}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-slate-500">Already Paid:</span><span className="font-bold text-emerald-600">₦{(paymentModalOrder.amountPaid || 0).toLocaleString()}</span></div>
                            <div className="flex justify-between text-xs pt-2 border-t border-slate-200"><span className="font-bold text-slate-700">Outstanding Balance:</span><span className="font-black text-rose-600">₦{(paymentModalOrder.amountOwed !== undefined ? paymentModalOrder.amountOwed : Math.max(0, paymentModalOrder.totalPrice - (paymentModalOrder.amountPaid || 0))).toLocaleString()}</span></div>
                        </div>

                        <form onSubmit={handleRecordSubsequentPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Payment Amount Now (₦)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={paymentModalOrder.amountOwed !== undefined ? paymentModalOrder.amountOwed : Math.max(0, paymentModalOrder.totalPrice - (paymentModalOrder.amountPaid || 0))}
                                    required
                                    value={subsequentAmount}
                                    onChange={(e) => setSubsequentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Enter amount..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={paymentSubmitting}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
                            >
                                {paymentSubmitting ? 'Processing Payment...' : 'Confirm & Apply Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Individual Customer Debt Profile Modal */}
            {debtModalCustomer && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Customer Debt Breakdown</h3>
                                <p className="text-xs text-slate-500">Debtor Profile: <span className="font-bold text-slate-800">{debtModalCustomer}</span></p>
                            </div>
                            <button onClick={() => setDebtModalCustomer(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {customerDebtList.find(c => c.customerName === debtModalCustomer)?.orders.map(order => {
                                const paid = order.amountPaid || 0;
                                const owed = order.amountOwed !== undefined ? order.amountOwed : Math.max(0, order.totalPrice - paid);
                                return (
                                    <div key={order.$id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-900">{order.tyreName} — <span className="text-slate-500 font-normal">{order.brand} ({order.size})</span></p>
                                            <p className="text-[10px] text-slate-400">Date: {new Date(order.$createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs font-bold text-slate-900">Total: ₦{order.totalPrice.toLocaleString()}</p>
                                                <p className="text-xs font-black text-rose-600">Owed: ₦{owed.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDebtModalCustomer(null);
                                                    setPaymentModalOrder(order);
                                                }}
                                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs shrink-0"
                                            >
                                                Pay
                                            </button>
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

export default TyreOrderComponent;