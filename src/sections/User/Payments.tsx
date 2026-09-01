import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { appwriteConfig, database, account } from '../../appwrite/Client';
import { Query } from 'appwrite';
import { Package, Calendar, Clock, Receipt } from 'lucide-react';

interface OrderDocument {
    $id: string;
    customerName: string;
    brand?: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    paymentStatus: string;
    $createdAt: string;
    tyreName?: string;
    greaseName?: string;
    partName?: string;
    size?: string;
    volume?: string;
    category?: string;
    accountId?: string;
}

interface GroupedTransaction {
    checkoutKey: string;
    createdAt: string;
    customerName: string;
    paymentStatus: string;
    items: OrderDocument[];
    totalAmount: number;
}

type ProductType = 'tyres' | 'grease' | 'motorParts';

export default function Payments() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ProductType>('tyres');
    const [transactions, setTransactions] = useState<GroupedTransaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // 1. Get current logged-in user ID securely from Appwrite account
                const user = await account.get();
                if (!user || !user.$id) {
                    setTransactions([]);
                    setLoading(false);
                    return;
                }

                let collectionId = appwriteConfig.tyreOrdersCollecton || 'tyre-order';
                if (activeTab === 'grease') {
                    collectionId = appwriteConfig.greaseOrdersCollection || 'grease-order';
                } else if (activeTab === 'motorParts') {
                    collectionId = appwriteConfig.motorPartsOrdersCollection || 'motorParts-order';
                }

                // 2. Fetch orders filtered specifically by the user's accountId and sorted newest first
                const response = await database.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId,
                    [
                        Query.equal('accountId', user.$id),
                        Query.orderDesc('$createdAt'),
                        Query.limit(100)
                    ]
                );

                const rawOrders = response.documents as unknown as OrderDocument[];

                // 3. Group simultaneous cart checkout items sharing the same timestamp second
                const groupedMap: { [key: string]: OrderDocument[] } = {};

                rawOrders.forEach(order => {
                    const timeKey = new Date(order.$createdAt).toISOString().slice(0, 19); 
                    if (!groupedMap[timeKey]) {
                        groupedMap[timeKey] = [];
                    }
                    groupedMap[timeKey].push(order);
                });

                // 4. Transform map into grouped transaction objects
                const formattedTransactions: GroupedTransaction[] = Object.entries(groupedMap).map(([key, items]) => {
                    const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                    return {
                        checkoutKey: key,
                        createdAt: items[0].$createdAt,
                        customerName: items[0].customerName || 'Guest',
                        paymentStatus: items[0].paymentStatus || 'Paid',
                        items: items,
                        totalAmount: totalAmount,
                    };
                });

                formattedTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setTransactions(formattedTransactions);
            } catch (error) {
                console.error('Error fetching user payments:', error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [activeTab]);

    const getItemName = (order: OrderDocument) => {
        return order.tyreName || order.greaseName || order.partName || 'Automotive Item';
    };

    const groupTransactionsByDate = (txList: GroupedTransaction[]) => {
        const groups: { [key: string]: GroupedTransaction[] } = {
            Today: [],
            Yesterday: [],
            Older: []
        };

        const todayStr = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        txList.forEach(tx => {
            const txDateStr = new Date(tx.createdAt).toDateString();
            if (txDateStr === todayStr) {
                groups.Today.push(tx);
            } else if (txDateStr === yesterdayStr) {
                groups.Yesterday.push(tx);
            } else {
                groups.Older.push(tx);
            }
        });

        return groups;
    };

    const groupedByDate = groupTransactionsByDate(transactions);

    const handleViewReceipt = (tx: GroupedTransaction) => {
        navigate('/Customer/receipt', {
            state: {
                createdAt: tx.createdAt,
                type: activeTab,
                accountId: tx.items[0]?.accountId
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pb-20 pt-4 space-y-6">
            <Header
                title="Payment History 💳"
                description="View your completed checkout sessions and transaction history."
                ctaText="Back to Store"
                ctaUrl="/Customer"
            />

            {/* Category Tab Switcher */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1 border border-slate-200/60">
                {(['tyres', 'grease', 'motorParts'] as ProductType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer capitalize ${
                            activeTab === type
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {type === 'motorParts' ? 'Motor Parts' : type}
                    </button>
                ))}
            </div>

            {/* Transactions Feed */}
            {loading ? (
                <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-12 text-center animate-pulse space-y-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Loading payment records...</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="bg-white/90 border border-slate-200/60 rounded-3xl p-12 text-center space-y-3">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No Payments Found</h3>
                    <p className="text-xs text-slate-500">You have no recorded transactions for {activeTab} yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedByDate).map(([dateLabel, group]) => {
                        if (group.length === 0) return null;

                        return (
                            <div key={dateLabel} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {dateLabel} ({group.length})
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {group.map((tx) => (
                                        <div
                                            key={tx.checkoutKey}
                                            className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                                        >
                                            {/* Transaction Meta Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                                                        {tx.paymentStatus}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleViewReceipt(tx)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                                                >
                                                    <Receipt className="w-3.5 h-3.5" />
                                                    <span>View Receipt</span>
                                                </button>
                                            </div>

                                            {/* Joined Items List (e.g. Item A and Item B from same checkout session) */}
                                            <div className="space-y-2">
                                                {tx.items.map((item) => (
                                                    <div key={item.$id} className="flex items-center justify-between text-xs bg-slate-50/60 px-3 py-2 rounded-xl border border-slate-100">
                                                        <div>
                                                            <span className="font-bold text-slate-800">{getItemName(item)}</span>
                                                            <span className="text-slate-500 ml-2">({item.brand || 'Generic'} • Qty: {item.quantity})</span>
                                                        </div>
                                                        <span className="font-semibold text-slate-700">₦{(item.totalPrice || 0).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Footer Total */}
                                            <div className="flex items-center justify-between pt-2 text-xs font-bold text-slate-900">
                                                <span className="text-slate-500">Session Total ({tx.items.length} items)</span>
                                                <span className="text-sm font-extrabold text-slate-900">₦{tx.totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}