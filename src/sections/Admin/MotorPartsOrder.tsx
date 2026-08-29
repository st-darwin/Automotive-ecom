import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ArrowLeft, Wrench, ShoppingBag, Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface MotorPartOrder {
    $id: string;
    $createdAt: string;
    customerName: string;
    partName: string;
    brand: string;
    category: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    paymentStatus: string;
}

const MotorPartsOrder = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<MotorPartOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.motorPartsOrdersCollection
            );
            setOrders(response.documents as unknown as MotorPartOrder[]);
        } catch (error) {
            console.error('Error fetching motor parts orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this motor part order record?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.motorPartsOrdersCollection,
                id
            );
            setOrders(prev => prev.filter(o => o.$id !== id));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting motor part order:', error);
        }
    };

    // Metrics calculation
    const totalOrdersCount = orders.length;

    const currentMonthOrdersCount = orders.filter((order) => {
        if (!order.$createdAt) return false;
        const orderDate = new Date(order.$createdAt);
        const now = new Date();
        return (
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
        );
    }).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <Header
                    title="Motor Parts Orders Management"
                    description="Track walk-in component purchases, categories, pricing, and payment statuses."
                />
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Orders Made</span>
                        <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : totalOrdersCount}</h3>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Orders This Month</span>
                        <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : currentMonthOrdersCount}</h3>
                    </div>
                </div>
            </div>

            {/* Orders Table Section */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-16 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Wrench className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-semibold text-slate-900">No motor part orders recorded</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Walk-in customer component transactions and purchase records will appear here once logged.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Customer Name</th>
                                    <th className="py-4 px-6">Part / Brand</th>
                                    <th className="py-4 px-6">Category</th>
                                    <th className="py-4 px-6">Qty</th>
                                    <th className="py-4 px-6">Unit Price</th>
                                    <th className="py-4 px-6">Total Price</th>
                                    <th className="py-4 px-6">Payment</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                {orders.map((order) => (
                                    <tr key={order.$id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-900">
                                            {order.customerName}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-0.5">
                                                <p className="text-slate-900 font-semibold">{order.partName}</p>
                                                <span className="text-[11px] text-slate-400">{order.brand}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-600">
                                            {order.category}
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-900">
                                            {order.quantity}
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-900">
                                            ₦{order.unitPrice?.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            ₦{order.totalPrice?.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                order.paymentStatus?.toLowerCase() === 'paid' 
                                                    ? 'bg-emerald-50 text-emerald-600' 
                                                    : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`} />
                                                {order.paymentStatus || 'Pending'}
                                            </span>
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
                                                <div className="absolute right-6 top-14 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                    <button
                                                        onClick={(e) => handleDelete(order.$id, e)}
                                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                        <span>Delete Record</span>
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
            )}
        </div>
    );
};

export default MotorPartsOrder;