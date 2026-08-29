import React, { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getUser } from '../../appwrite/Auth';
import { ShoppingBag, Users, DollarSign, Clock, ArrowUpRight, Calendar } from 'lucide-react';
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

const Dashboard = () => {
    const user = useLoaderData() as { name: string };
    const userName = user?.name ? user.name.split(' ')[0] : 'Admin';
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthRevenue: 0,
        totalOrders: 0,
        monthOrders: 0,
        totalCustomers: 0,
        pendingCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [tyres, grease, parts, users] = await Promise.all([
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.tyreOrdersCollecton),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.greaseOrdersCollection),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.motorPartsOrdersCollection),
                    database.listDocuments(appwriteConfig.databaseId, appwriteConfig.userCollectionId),
                ]);

                const allOrders = [...tyres.documents, ...grease.documents, ...parts.documents];
                
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                let revenue = 0;
                let monthRev = 0;
                let mOrdersCount = 0;
                let pending = 0;

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
            } catch (error) {
                console.error('Error loading dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <Header
                title={`Welcome back, ${userName} 👋`}
                description="Your automotive command center is primed. Monitor real-time store inventory, track performance metrics, and keep Kinchris Switch running at peak velocity."
                ctaText="View Products"
                ctaUrl="/inventory"
            />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Revenue</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Revenue</span>
                    <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : `₦${stats.totalRevenue.toLocaleString()}`}</h3>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">This Month</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Revenue This Month</span>
                    <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : `₦${stats.monthRevenue.toLocaleString()}`}</h3>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Sales</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Orders</span>
                    <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.totalOrders}</h3>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Monthly</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Orders This Month</span>
                    <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.monthOrders}</h3>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Users</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Customers</span>
                    <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.totalCustomers}</h3>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Unpaid</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pending Payments</span>
                    <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.pendingCount}</h3>
                </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Manage Tyres', path: '/inventory/tyres', color: 'text-blue-600 bg-blue-50' },
                    { title: 'Manage Grease', path: '/inventory/grease', color: 'text-amber-600 bg-amber-50' },
                    { title: 'Manage Motor Parts', path: '/invetory/motor-parts', color: 'text-emerald-600 bg-emerald-50' },
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