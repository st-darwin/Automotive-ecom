import { useEffect, useState, useRef } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getUser } from '../../appwrite/Auth';
import { ShoppingBag, Users, DollarSign, Clock, ArrowUpRight, Calendar, ChevronLeft, ChevronRight, Layers, AlertTriangle, Download, Package } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

export const Dashboardoader = async () => {
    try {
        const user = await getUser();
        return user;
    } catch (e) {
        console.log("Unable to get user details", e);
        return null;
    }
};

interface Order {
    $id: string;
    $createdAt: string;
    totalPrice?: number;
    paymentStatus?: string;
    customerName?: string;
    productName?: string;
    brand?: string;
    unitPrice?: number;
    quantity?: number;
    type: 'Tyres' | 'Grease' | 'Motor Parts';
}

interface StoreItem {
    $id: string;
    customerName?: string;
    brand?: string;
    unitPrice?: number;
    quantity?: number;
    totalPrice?: number;
    paymentStatus?: string;
    tyreName?: string;
    greaseName?: string;
    partName?: string;
    size?: string;
    volume?: string;
    category?: string;
}

const Dashboard = () => {
    const user = useLoaderData() as { name: string };
    const userName = user?.name ? user.name.split(' ')[0] : 'Admin';
    const navigate = useNavigate();
    const sliderRef = useRef<HTMLDivElement>(null);
    const storeSliderRef = useRef<HTMLDivElement>(null);

    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthRevenue: 0,
        totalOrders: 0,
        monthOrders: 0,
        totalCustomers: 0,
        pendingCount: 0
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Raw store orders for export cards
    const [storeOrders, setStoreOrders] = useState<{
        tyres: StoreItem[];
        grease: StoreItem[];
        motorParts: StoreItem[];
    }>({
        tyres: [],
        grease: [],
        motorParts: []
    });

    const [collectionMetrics, setCollectionMetrics] = useState([
        { name: 'Tyres Store', currentWeekOrders: 0, currentWeekRevenue: 0, lastWeekOrders: 0, lastWeekRevenue: 0 },
        { name: 'Grease Store', currentWeekOrders: 0, currentWeekRevenue: 0, lastWeekOrders: 0, lastWeekRevenue: 0 },
        { name: 'Motor Parts Store', currentWeekOrders: 0, currentWeekRevenue: 0, lastWeekOrders: 0, lastWeekRevenue: 0 },
    ]);

    const getWeekRange = (dateString: string) => {
        const orderDate = new Date(dateString);
        const now = new Date();
        const dayOfWeek = now.getDay();
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const currentMonday = new Date(now);
        currentMonday.setDate(now.getDate() + distanceToMonday);
        currentMonday.setHours(0, 0, 0, 0);

        const currentSunday = new Date(currentMonday);
        currentSunday.setDate(currentMonday.getDate() + 6);
        currentSunday.setHours(23, 59, 59, 999);

        const lastMonday = new Date(currentMonday);
        lastMonday.setDate(currentMonday.getDate() - 7);

        const lastSunday = new Date(currentSunday);
        lastSunday.setDate(currentSunday.getDate() - 7);

        if (orderDate >= currentMonday && orderDate <= currentSunday) return 'current';
        if (orderDate >= lastMonday && orderDate <= lastSunday) return 'last';
        return 'older';
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [tyresRes, greaseRes, partsRes, users] = await Promise.all([
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.tyreOrdersCollecton),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.greaseOrdersCollection),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.motorPartsOrdersCollection),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.userCollectionId),
                ]);

                const formattedTyres: Order[] = tyresRes.documents.map((doc: any) => ({ 
                    ...doc, 
                    productName: doc.tyreName, 
                    type: 'Tyres' 
                }));
                const formattedGrease: Order[] = greaseRes.documents.map((doc: any) => ({ 
                    ...doc, 
                    productName: doc.greaseName, 
                    type: 'Grease' 
                }));
                const formattedParts: Order[] = partsRes.documents.map((doc: any) => ({ 
                    ...doc, 
                    productName: doc.partName, 
                    type: 'Motor Parts' 
                }));

                setStoreOrders({
                    tyres: tyresRes.documents as StoreItem[],
                    grease: greaseRes.documents as StoreItem[],
                    motorParts: partsRes.documents as StoreItem[]
                });

                const allOrders = [...formattedTyres, ...formattedGrease, ...formattedParts];
                allOrders.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                let revenue = 0;
                let monthRev = 0;
                let mOrdersCount = 0;
                let pending = 0;

                const metricsMap: Record<string, { curOrders: number; curRev: number; lastOrders: number; lastRev: number }> = {
                    'Tyres': { curOrders: 0, curRev: 0, lastOrders: 0, lastRev: 0 },
                    'Grease': { curOrders: 0, curRev: 0, lastOrders: 0, lastRev: 0 },
                    'Motor Parts': { curOrders: 0, curRev: 0, lastOrders: 0, lastRev: 0 }
                };

                allOrders.forEach((order) => {
                    const price = order.totalPrice || 0;
                    revenue += price;

                    if (order.paymentStatus?.toLowerCase() === 'pending') {
                        pending += 1;
                    }

                    if (order.$createdAt) {
                        const orderDate = new Date(order.$createdAt);
                        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                            monthRev += price;
                            mOrdersCount += 1;
                        }

                        const weekType = getWeekRange(order.$createdAt);
                        if (metricsMap[order.type]) {
                            if (weekType === 'current') {
                                metricsMap[order.type].curOrders += 1;
                                metricsMap[order.type].curRev += price;
                            } else if (weekType === 'last') {
                                metricsMap[order.type].lastOrders += 1;
                                metricsMap[order.type].lastRev += price;
                            }
                        }
                    }
                });

                setStats({
                    totalRevenue: revenue,
                    monthRevenue: monthRev,
                    totalOrders: allOrders.length,
                    monthOrders: mOrdersCount,
                    totalCustomers: users.total || users.documents.length,
                    pendingCount: pending
                });

                setCollectionMetrics([
                    { name: 'Tyres Store', currentWeekOrders: metricsMap['Tyres'].curOrders, currentWeekRevenue: metricsMap['Tyres'].curRev, lastWeekOrders: metricsMap['Tyres'].lastOrders, lastWeekRevenue: metricsMap['Tyres'].lastRev },
                    { name: 'Grease Store', currentWeekOrders: metricsMap['Grease'].curOrders, currentWeekRevenue: metricsMap['Grease'].curRev, lastWeekOrders: metricsMap['Grease'].lastOrders, lastWeekRevenue: metricsMap['Grease'].lastRev },
                    { name: 'Motor Parts Store', currentWeekOrders: metricsMap['Motor Parts'].curOrders, currentWeekRevenue: metricsMap['Motor Parts'].curRev, lastWeekOrders: metricsMap['Motor Parts'].lastOrders, lastWeekRevenue: metricsMap['Motor Parts'].lastRev },
                ]);

                setRecentOrders(allOrders.slice(0, 6));
            } catch (error) {
                console.error('Error loading dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const { scrollLeft, clientWidth } = ref.current;
            const scrollAmount = clientWidth > 768 ? clientWidth / 2 : clientWidth * 0.85;
            ref.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const exportStoreData = (storeName: string, items: StoreItem[]) => {
        let csvContent = "data:text/csv;charset=utf-8,ID,Customer,Product,Brand,UnitPrice,Quantity,TotalPrice,PaymentStatus\n";
        items.forEach(item => {
            const pName = item.tyreName || item.greaseName || item.partName || 'N/A';
            csvContent += `${item.$id},"${item.customerName || 'N/A'}","${pName}","${item.brand || 'N/A'}",${item.unitPrice || 0},${item.quantity || 0},${item.totalPrice || 0},"${item.paymentStatus || 'N/A'}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${storeName.toLowerCase().replace(/\s+/g, '_')}_orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportDashboardReport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Metric,Value\n"
            + `Total Revenue,${stats.totalRevenue}\n`
            + `Month Revenue,${stats.monthRevenue}\n`
            + `Total Orders,${stats.totalOrders}\n`
            + `Month Orders,${stats.monthOrders}\n`
            + `Total Customers,${stats.totalCustomers}\n`
            + `Pending Payments,${stats.pendingCount}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kinchris_switch_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const metricCards = [
        { title: 'Total Revenue', value: loading ? '...' : `₦${stats.totalRevenue.toLocaleString()}`, badge: 'Revenue', badgeClass: 'text-emerald-600 bg-emerald-50', iconContainer: 'bg-emerald-50 text-emerald-600', icon: <DollarSign className="w-6 h-6" /> },
        { title: 'Revenue This Month', value: loading ? '...' : `₦${stats.monthRevenue.toLocaleString()}`, badge: 'This Month', badgeClass: 'text-teal-600 bg-teal-50', iconContainer: 'bg-teal-50 text-teal-600', icon: <DollarSign className="w-6 h-6" /> },
        { title: 'Total Orders', value: loading ? '...' : stats.totalOrders, badge: 'Sales', badgeClass: 'text-blue-600 bg-blue-50', iconContainer: 'bg-blue-50 text-blue-600', icon: <ShoppingBag className="w-6 h-6" /> },
        { title: 'Orders This Month', value: loading ? '...' : stats.monthOrders, badge: 'Monthly', badgeClass: 'text-indigo-600 bg-indigo-50', iconContainer: 'bg-indigo-50 text-indigo-600', icon: <Calendar className="w-6 h-6" /> },
        { title: 'Total Customers', value: loading ? '...' : stats.totalCustomers, badge: 'Users', badgeClass: 'text-purple-600 bg-purple-50', iconContainer: 'bg-purple-50 text-purple-600', icon: <Users className="w-6 h-6" /> },
        { title: 'Pending Payments', value: loading ? '...' : stats.pendingCount, badge: 'Unpaid', badgeClass: 'text-amber-600 bg-amber-50', iconContainer: 'bg-amber-50 text-amber-600', icon: <Clock className="w-6 h-6" /> }
    ];

    const storeDownloadCards = [
        {
            title: 'Tyres Orders',
            description: 'Download complete records of tyre orders mapped by customer name, tyre name, brand, size, pricing, and quantities.',
            items: storeOrders.tyres,
            color: 'text-blue-600 bg-blue-50',
            border: 'border-blue-100'
        },
        {
            title: 'Grease Orders',
            description: 'Export all grease and lubricant order entries with brand tags, volume specs, unit prices, and payment statuses.',
            items: storeOrders.grease,
            color: 'text-amber-600 bg-amber-50',
            border: 'border-amber-100'
        },
        {
            title: 'Motor Parts Orders',
            description: 'Access complete motor parts transaction histories including part names, categories, manufacturers, and totals.',
            items: storeOrders.motorParts,
            color: 'text-emerald-600 bg-emerald-50',
            border: 'border-emerald-100'
        }
    ];

    const getStoreBadgeColor = (type: string) => {
        switch (type) {
            case 'Tyres': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'Grease': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'Motor Parts': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Header
                    title={`Welcome back, ${userName} 👋`}
                    description="Your automotive command center is primed. Monitor real-time store orders, track performance metrics, and keep Kinchris Switch running at peak velocity."
                    ctaText="View Products"
                    ctaUrl="/inventory"
                />
                <button
                    onClick={exportDashboardReport}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs font-semibold text-xs cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                </button>
            </div>

     {/* Metrics Slider Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Performance Metrics</h2>
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scrollSlider(sliderRef, 'left')}
                            className="p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scrollSlider(sliderRef, 'right')}
                            className="p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={sliderRef}
                    className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {metricCards.map((card, idx) => (
                        <div
                            key={idx}
                            className="min-w-[280px] sm:min-w-[320px] flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs snap-start flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconContainer}`}>
                                        {card.icon}
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${card.badgeClass}`}>
                                        {card.badge}
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                    {card.title}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{card.value}</h3>
                        </div>
                    ))}
                </div>
            </div>


            {/* Swipeable Store Order Download Cards */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Store Orders & Document Exports</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Swipe through individual stores to review order write-ups and download transaction records.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scrollSlider(storeSliderRef, 'left')}
                            className="p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scrollSlider(storeSliderRef, 'right')}
                            className="p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={storeSliderRef}
                    className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {storeDownloadCards.map((card, idx) => (
                        <div
                            key={idx}
                            className="min-w-[300px] sm:min-w-[360px] flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs snap-start flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.color}`}>
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                                        {card.items.length} orders mapped
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">{card.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-6">{card.description}</p>
                            </div>

                            <button
                                onClick={() => exportStoreData(card.title, card.items)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download {card.title.split(' ')[0]} CSV</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

       
            {/* Weekly Collection Performance Table */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Store Breakdown (Weekly Comparison)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Orders and revenue summary separated by store collection for current and past weeks.</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Store Collection</th>
                                    <th className="py-4 px-6 text-center">Current Week Orders</th>
                                    <th className="py-4 px-6 text-right">Current Week Revenue</th>
                                    <th className="py-4 px-6 text-center">Last Week Orders</th>
                                    <th className="py-4 px-6 text-right">Last Week Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                {loading ? (
                                    [1, 2, 3].map((n) => (
                                        <tr key={n}>
                                            <td colSpan={5} className="py-4 px-6 animate-pulse bg-slate-50/20">Loading metrics...</td>
                                        </tr>
                                    ))
                                ) : (
                                    collectionMetrics.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-6 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-slate-900">{row.name}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-semibold">
                                                    {row.currentWeekOrders}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-bold text-slate-900">
                                                ₦{row.currentWeekRevenue.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                                    {row.lastWeekOrders}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold text-slate-500">
                                                ₦{row.lastWeekRevenue.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Store Purchases Section */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Recent Store Orders</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Latest transactions fetched across Tyres, Grease, and Motor Parts stores.</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white/60 border border-slate-200/60 rounded-3xl p-6 h-36 animate-pulse" />
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-8 text-center text-slate-500 text-xs">
                        No recent store orders recorded yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentOrders.map((order) => (
                            <div
                                key={order.$id}
                                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getStoreBadgeColor(order.type)}`}>
                                            {order.type} Store
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400">
                                            {new Date(order.$createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                        {order.productName || 'Automotive Order'}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Customer: <span className="font-semibold text-slate-700">{order.customerName || 'Walk-in Client'}</span>
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                        ₦{(order.totalPrice || 0).toLocaleString()}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                                        order.paymentStatus?.toLowerCase() === 'paid' 
                                            ? 'bg-emerald-50 text-emerald-600' 
                                            : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {order.paymentStatus || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Manage Tyres', path: '/inventory/tyres', color: 'text-blue-600 bg-blue-50' },
                    { title: 'Manage Grease', path: '/inventory/grease', color: 'text-amber-600 bg-amber-50' },
                    { title: 'Manage Motor Parts', path: '/inventory/motor-parts', color: 'text-emerald-600 bg-emerald-50' },
                    { title: 'View Customers', path: '/customers', color: 'text-purple-600 bg-purple-50' },
                ].map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(action.path)}
                        className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl text-left flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group shadow-2xs"
                    >
                        <span className="text-sm font-semibold text-slate-800">{action.title}</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;