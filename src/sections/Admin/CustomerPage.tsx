import React, { useEffect, useState, useMemo } from 'react';
import Header from '../../components/Header';
import { Users, Mail, Shield, MoreVertical, Trash2, UserCheck, ShoppingBag, Wallet } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface Customer {
    $id: string;
    $createdAt: string;
    name: string;
    email: string;
    accountId: string;
    role: string;
}

interface ManualCustomerOrder {
    $id: string;
    $createdAt: string;
    customerName: string;
    accountId?: string;
    totalPrice?: number;
    amountPaid?: number;
    amountOwed?: number;
    paymentStatus?: string;
    tyreName?: string;
}

interface AggregatedManualCustomer {
    customerName: string;
    orders: ManualCustomerOrder[];
    totalDebt: number;
    latestDate: string;
}

type TabType = 'online' | 'manual';

const CustomerPage = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [rawManualOrders, setRawManualOrders] = useState<ManualCustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('online');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const fetchCustomersData = async () => {
        try {
            setLoading(true);
            const [userRes, tyreOrderRes] = await Promise.all([
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.userCollectionId),
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.tyreOrdersCollecton)
            ]);
            
            // 1. Process Online Registered Customers
            const rawCustomers = userRes.documents as unknown as Customer[];
            const uniqueUserMap = new Map<string, Customer>();
            rawCustomers.forEach(cust => {
                const key = cust.email ? cust.email.trim().toLowerCase() : (cust.accountId || cust.$id);
                if (!uniqueUserMap.has(key)) {
                    uniqueUserMap.set(key, cust);
                }
            });
            setCustomers(Array.from(uniqueUserMap.values()));

            // 2. Process Manual / Physical Customers where accountId === 'admin-manual-entry'
            const allOrders = tyreOrderRes.documents as unknown as ManualCustomerOrder[];
            const filteredManual = allOrders.filter(order => order.accountId === 'admin-manual-entry' || !order.accountId);
            setRawManualOrders(filteredManual);

        } catch (error) {
            console.error('Error fetching customers data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomersData();
    }, []);

    // Aggregate manual customers by name and calculate total debt
    const aggregatedManualCustomers: AggregatedManualCustomer[] = useMemo(() => {
        const map = new Map<string, AggregatedManualCustomer>();

        rawManualOrders.forEach(order => {
            const name = (order.customerName || 'Walk-in Customer').trim();
            const nameKey = name.toLowerCase();

            const price = Number(order.totalPrice) || 0;
            const isPaid = order.paymentStatus?.toLowerCase() === 'paid';
            const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : (isPaid ? price : 0);
            const owed = order.amountOwed !== undefined ? Number(order.amountOwed) : Math.max(0, price - paid);

            if (!map.has(nameKey)) {
                map.set(nameKey, {
                    customerName: name,
                    orders: [],
                    totalDebt: 0,
                    latestDate: order.$createdAt
                });
            }

            const entry = map.get(nameKey)!;
            entry.orders.push(order);
            entry.totalDebt += owed;
            if (new Date(order.$createdAt) > new Date(entry.latestDate)) {
                entry.latestDate = order.$createdAt;
            }
        });

        return Array.from(map.values()).sort((a, b) => b.totalDebt - a.totalDebt);
    }, [rawManualOrders]);

    // Total debt across all manual customers
    const totalManualDebt = useMemo(() => {
        return aggregatedManualCustomers.reduce((sum, c) => sum + c.totalDebt, 0);
    }, [aggregatedManualCustomers]);

    const handleDeleteUser = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this customer record?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                id
            );
            setCustomers(prev => prev.filter(c => c.$id !== id));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    const handleDeleteManualOrder = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this manual customer order record?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.tyreOrdersCollecton,
                orderId
            );
            setRawManualOrders(prev => prev.filter(o => o.$id !== orderId));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting manual order:', error);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            {/* Header Section */}
            <Header
                title="Customer Management"
                description="View registered online users, manual walk-in clients, credit balances, and directory records."
            />

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Online Customers</span>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : customers.length}</h3>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Walk-in Customers</span>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : aggregatedManualCustomers.length}</h3>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs flex items-center gap-4 sm:col-span-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Manual Total Debt</span>
                        <h3 className="text-xl sm:text-2xl font-black text-rose-600">₦{loading ? '...' : totalManualDebt.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Minimal Clean Single-Line Tabs */}
            <div className="flex border-b border-slate-200 gap-8">
                <button
                    onClick={() => setActiveTab('online')}
                    className={`pb-3 text-xs font-bold transition-all cursor-pointer relative flex items-center gap-2 ${
                        activeTab === 'online'
                            ? 'text-slate-900 border-b-2 border-slate-900 -mb-px'
                            : 'text-slate-400 hover:text-slate-700'
                    }`}
                >
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Online Customers</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                        {customers.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`pb-3 text-xs font-bold transition-all cursor-pointer relative flex items-center gap-2 ${
                        activeTab === 'manual'
                            ? 'text-slate-900 border-b-2 border-slate-900 -mb-px'
                            : 'text-slate-400 hover:text-slate-700'
                    }`}
                >
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Manual / Physical Customers</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                        {aggregatedManualCustomers.length}
                    </span>
                </button>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : activeTab === 'online' ? (
                customers.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                            <Users className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 max-w-sm mx-auto">
                            <h3 className="text-base font-semibold text-slate-900">No online customers registered</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Registered online user accounts and profiles will appear here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="py-4 px-4 sm:px-6">Name</th>
                                        <th className="py-4 px-4 sm:px-6">Email</th>
                                        <th className="py-4 px-4 sm:px-6">Account ID</th>
                                        <th className="py-4 px-4 sm:px-6">Role</th>
                                        <th className="py-4 px-4 sm:px-6">Joined Date</th>
                                        <th className="py-4 px-4 sm:px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                    {customers.map((customer) => (
                                        <tr key={customer.$id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900">{customer.name || 'N/A'}</td>
                                            <td className="py-4 px-4 sm:px-6">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[180px] sm:max-w-none">{customer.email || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 font-mono text-[11px] text-slate-500">{customer.accountId || 'N/A'}</td>
                                            <td className="py-4 px-4 sm:px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                    customer.role?.toLowerCase() === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    <Shield className="w-3 h-3" />
                                                    {customer.role || 'customer'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-slate-500 whitespace-nowrap">
                                                {customer.$createdAt ? new Date(customer.$createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-right relative" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === customer.$id ? null : customer.$id);
                                                    }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {activeDropdown === customer.$id && (
                                                    <div className="absolute right-6 top-14 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                        <button
                                                            onClick={(e) => handleDeleteUser(customer.$id, e)}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                            <span>Delete User</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                aggregatedManualCustomers.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 max-w-sm mx-auto">
                            <h3 className="text-base font-semibold text-slate-900">No manual customers found</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Walk-in or manual orders logged by admin will appear here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/85 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="py-4 px-6">Customer Name</th>
                                        <th className="py-4 px-6">Transactions</th>
                                        <th className="py-4 px-6">Amount Owed (Debt)</th>
                                        <th className="py-4 px-6">Latest Activity</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                    {aggregatedManualCustomers.map((mCustomer) => (
                                        <tr key={mCustomer.customerName} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900 text-sm">{mCustomer.customerName}</td>
                                            <td className="py-4 px-6 text-slate-700">{mCustomer.orders.length} order{mCustomer.orders.length > 1 ? 's' : ''}</td>
                                            <td className="py-4 px-6 font-black text-rose-600 text-sm">
                                                ₦{mCustomer.totalDebt.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                                                {new Date(mCustomer.latestDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right relative" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === mCustomer.customerName ? null : mCustomer.customerName);
                                                    }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {activeDropdown === mCustomer.customerName && (
                                                    <div className="absolute right-6 top-14 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 text-left space-y-1">
                                                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delete Orders</div>
                                                        {mCustomer.orders.map(order => (
                                                            <button
                                                                key={order.$id}
                                                                onClick={(e) => handleDeleteManualOrder(order.$id, e)}
                                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer truncate"
                                                            >
                                                                <Trash2 className="w-3 h-3 shrink-0 text-rose-500" />
                                                                <span className="truncate">Order (₦{order.totalPrice?.toLocaleString() || 0})</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Stacked Card View */}
                        <div className="divide-y divide-slate-100 sm:hidden">
                            {aggregatedManualCustomers.map((mCustomer) => (
                                <div key={mCustomer.customerName} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{mCustomer.customerName}</h4>
                                            <p className="text-[11px] text-slate-500">{mCustomer.orders.length} order{mCustomer.orders.length > 1 ? 's' : ''} • Last active {new Date(mCustomer.latestDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                                            ₦{mCustomer.totalDebt.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pt-1">
                                        {mCustomer.orders.map(order => {
                                            const price = Number(order.totalPrice) || 0;
                                            const paid = order.amountPaid !== undefined ? Number(order.amountPaid) : 0;
                                            const owed = order.amountOwed !== undefined ? Number(order.amountOwed) : Math.max(0, price - paid);
                                            return (
                                                <div key={order.$id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{order.tyreName || 'Walk-in Item'}</p>
                                                        <p className="text-[10px] text-slate-400">Owed: <span className="font-bold text-rose-600">₦{owed.toLocaleString()}</span></p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteManualOrder(order.$id, e)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                                                        title="Delete order"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default CustomerPage;