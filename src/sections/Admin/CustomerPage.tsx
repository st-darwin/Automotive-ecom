import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { Users, Mail, Shield, MoreVertical, Trash2 } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface Customer {
    $id: string;
    $createdAt: string;
    name: string;
    email: string;
    accountId: string;
    role: string;
}

const CustomerPage = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId
            );
            setCustomers(response.documents as unknown as Customer[]);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
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

    const totalCustomersCount = customers.length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            {/* Header Section */}
            <Header
                title="Customer Management"
                description="View registered users, roles, account mapping, and directory records."
            />

            {/* Metrics Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xs flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Admin & Customers</span>
                        <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : totalCustomersCount}</h3>
                    </div>
                </div>
            </div>

            {/* Customers Table Section */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : customers.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-16 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Users className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-semibold text-slate-900">No customers registered</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Registered user accounts and profiles will appear here.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Name</th>
                                    <th className="py-4 px-6">Email</th>
                                    <th className="py-4 px-6">Account ID</th>
                                    <th className="py-4 px-6">Role</th>
                                    <th className="py-4 px-6">Joined Date</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                {customers.map((customer) => (
                                    <tr key={customer.$id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-900">
                                            {customer.name || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{customer.email || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                                            {customer.accountId || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                customer.role?.toLowerCase() === 'admin' 
                                                    ? 'bg-purple-50 text-purple-600' 
                                                    : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                <Shield className="w-3 h-3" />
                                                {customer.role || 'customer'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500">
                                            {customer.$createdAt ? new Date(customer.$createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 text-right relative" onClick={e => e.stopPropagation()}>
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
                                                        onClick={(e) => handleDelete(customer.$id, e)}
                                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
            )}
        </div>
    );
};

export default CustomerPage;