import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { appwriteConfig, database } from '../../appwrite/Client';
import { CheckCircle2, Package, ArrowLeft, Printer } from 'lucide-react';
import { Query } from 'appwrite';

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
}

export default function Receipt() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Read orderId/type from URL query or fallback to navigation state passed from cart checkout
    const orderId = searchParams.get('orderId');
    const orderType = (searchParams.get('type') as 'tyres' | 'grease' | 'motorParts') || location.state?.type || 'tyres';
    const stateCreatedAt = location.state?.createdAt;

    const [orders, setOrders] = useState<OrderDocument[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                let collectionId = appwriteConfig.tyreOrdersCollecton || 'tyre-order';
                if (orderType === 'grease') {
                    collectionId = appwriteConfig.greaseOrdersCollection || 'grease-order';
                } else if (orderType === 'motorParts') {
                    collectionId = appwriteConfig.motorPartsOrdersCollection || 'motorParts-order';
                }

                if (orderId) {
                    try {
                        const doc = await database.getDocument(
                            appwriteConfig.databaseId,
                            collectionId,
                            orderId
                        );
                        if (doc) {
                            setOrders([doc as unknown as OrderDocument]);
                            setLoading(false);
                            return;
                        }
                    } catch {
                        // Fallback below if exact ID lookup fails
                    }
                }

                // If no exact orderId or fallback needed, fetch the most recent paid orders matching this category/session timeframe
                const queries = [Query.orderDesc('$createdAt'), Query.limit(10)];
                
                const response = await database.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId,
                    queries
                );

                let matchedDocs = response.documents as unknown as OrderDocument[];

                // If we have a stateCreatedAt timestamp from cart checkout, filter documents created around that timestamp (e.g. within last 60 seconds)
                if (stateCreatedAt) {
                    const checkoutTime = new Date(stateCreatedAt).getTime();
                    const filtered = matchedDocs.filter(doc => {
                        const docTime = new Date(doc.$createdAt).getTime();
                        return Math.abs(docTime - checkoutTime) < 120000; // within 2 minutes
                    });
                    if (filtered.length > 0) {
                        matchedDocs = filtered;
                    }
                }

                setOrders(matchedDocs);
            } catch (error) {
                console.error('Error fetching order receipt:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, orderType, stateCreatedAt]);

    const getItemName = (order: OrderDocument) => {
        return order.tyreName || order.greaseName || order.partName || 'Automotive Item';
    };

    const getItemSpec = (order: OrderDocument) => {
        return order.size || order.volume || order.category || null;
    };

    const grandTotal = orders.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 pb-20 pt-4 space-y-6">
            <Header
                title="Transaction Receipt 🧾"
                description="Verified order details and payment confirmation summary."
                ctaText="Back to Catalog"
                ctaUrl="/Customer"
            />

            {loading ? (
                <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-12 text-center animate-pulse space-y-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Loading your receipt details...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white/90 border border-slate-200/60 rounded-3xl p-12 text-center space-y-4">
                    <Package className="w-12 h-12 text-slate-300 mx-auto" />
                    <h2 className="text-sm font-bold text-slate-800">Receipt Not Found</h2>
                    <p className="text-xs text-slate-500">We couldn't locate recent order records for this session.</p>
                    <button
                        onClick={() => navigate('/Customer')}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-semibold cursor-pointer"
                    >
                        Return to Store
                    </button>
                </div>
            ) : (
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    {/* Status Banner */}
                    <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-slate-100 space-y-2">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h2 className="text-base font-bold text-slate-900">Payment Successful!</h2>
                        <p className="text-xs text-slate-500">Your order has been logged and inventory has been updated.</p>
                    </div>

                    {/* Order Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <div>
                            <span className="text-slate-400 block font-medium">Order Reference ID(s)</span>
                            <span className="font-mono font-semibold text-slate-700 truncate block">
                                {orders.length === 1 ? orders[0]?.$id : `${orders.length} items checked out`}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Date & Time</span>
                            <span className="font-semibold text-slate-700">
                                {orders[0]?.$createdAt ? new Date(orders[0].$createdAt).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Customer Name</span>
                            <span className="font-semibold text-slate-700">{orders[0]?.customerName || 'Valued Customer'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Payment Status</span>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 mt-0.5">
                                {orders[0]?.paymentStatus || 'Paid'}
                            </span>
                        </div>
                    </div>

                    {/* Item Breakdown List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Purchased Items ({orders.length})</h3>
                        <div className="space-y-2">
                            {orders.map((orderItem) => (
                                <div key={orderItem.$id} className="border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between gap-4 bg-white">
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{getItemName(orderItem)}</h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Brand: {orderItem.brand || 'Generic'} {getItemSpec(orderItem) ? `• Spec: ${getItemSpec(orderItem)}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500">Qty: {orderItem.quantity}</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                                            ₦{(orderItem.totalPrice || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-sm font-bold text-slate-900">
                        <span>Total Paid</span>
                        <span className="text-base">₦{grandTotal.toLocaleString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Receipt</span>
                        </button>
                        <button
                            onClick={() => navigate('/Customer')}
                            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Store</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}