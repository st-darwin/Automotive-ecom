import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { appwriteConfig, database } from '../../appwrite/Client';
import { Package, ArrowLeft, Download } from 'lucide-react';
import { Query } from 'appwrite';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

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

export default function Receipt() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const receiptRef = useRef<HTMLDivElement>(null);

    const orderId = searchParams.get('orderId');
    const orderType = (searchParams.get('type') as 'tyres' | 'grease' | 'motorParts') || location.state?.type || 'tyres';
    const stateCreatedAt = location.state?.createdAt;
    const accountId = location.state?.accountId || searchParams.get('accountId');

    const [orders, setOrders] = useState<OrderDocument[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloading, setDownloading] = useState<boolean>(false);

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
                    } catch(e) {
                        console.error('Error fetching specific order document:', e);
                    }
                }

                const queries = [Query.orderDesc('$createdAt'), Query.limit(15)];
                if (accountId) {
                    queries.push(Query.equal('accountId', accountId));
                }
                
                const response = await database.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId,
                    queries
                );

                let matchedDocs = response.documents as unknown as OrderDocument[];

                if (stateCreatedAt) {
                    const checkoutTime = new Date(stateCreatedAt).getTime();
                    const filtered = matchedDocs.filter(doc => {
                        const docTime = new Date(doc.$createdAt).getTime();
                        return Math.abs(docTime - checkoutTime) < 120000;
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
    }, [orderId, orderType, stateCreatedAt, accountId]);

    const getItemName = (order: OrderDocument) => {
        return order.tyreName || order.greaseName || order.partName || 'Automotive Item';
    };

    const getItemSpec = (order: OrderDocument) => {
        return order.size || order.volume || order.category || null;
    };

    const grandTotal = orders.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const handleDownloadPDF = async () => {
        if (!receiptRef.current) return;
        try {
            setDownloading(true);
            const canvas = await html2canvas(receiptRef.current, {
                scale: 3, 
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Invoice-Kinchris-${orders[0]?.$id || 'order'}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-6 lg:px-8 pb-24 pt-4 space-y-5">
            <Header
                title="Transaction Receipt 🧾"
                description="Verified order details and payment confirmation summary."
                ctaText="View Orders"
                ctaUrl="/orders"
            />

            {loading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center animate-pulse space-y-4 shadow-sm">
                    <div className="w-10 h-10 bg-slate-200 rounded-full mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Loading your receipt details...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
                    <Package className="w-12 h-12 text-slate-300 mx-auto" />
                    <h2 className="text-sm font-bold text-slate-800">Receipt Not Found</h2>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">We couldn't locate recent order records matching your account session.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-semibold cursor-pointer"
                    >
                        Return to dashboard
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Professional Printable Container */}
                    <div 
                        ref={receiptRef} 
                        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                        className="border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-sm space-y-6 sm:space-y-8 font-sans overflow-hidden"
                    >
                        {/* Company & Receipt Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                                    Kinchris Switch Enterprise
                                </h1>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Official Sales & Distribution Invoice</p>
                            </div>
                            <div className="w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {orders[0]?.paymentStatus || 'Paid'}
                                </span>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 font-mono">
                                    Ref: {orders.length === 1 ? orders[0]?.$id : 'Bulk Checkout'}
                                </p>
                            </div>
                        </div>

                        {/* Customer & Date Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                            <div>
                                <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Billed To</span>
                                <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                                    {orders[0]?.customerName || 'Valued Customer'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Issued Date</span>
                                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                                    {orders[0]?.$createdAt ? new Date(orders[0].$createdAt).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Structured Items Table with horizontal scroll safety for small devices */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Item Breakdown</h3>
                            <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[300px]">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-slate-200">
                                            <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold">Item Description</th>
                                            <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold text-center">Qty</th>
                                            <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {orders.map((orderItem) => (
                                            <tr key={orderItem.$id} className="hover:bg-slate-50">
                                                <td className="py-3 px-3 sm:py-4 sm:px-4">
                                                    <p className="font-bold text-slate-900">{getItemName(orderItem)}</p>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                                                        Brand: {orderItem.brand || 'Generic'} {getItemSpec(orderItem) ? `• Spec: ${getItemSpec(orderItem)}` : ''}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-3 sm:py-4 sm:px-4 text-center font-medium text-slate-700">
                                                    {orderItem.quantity}
                                                </td>
                                                <td className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                                    ₦{(orderItem.totalPrice || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Grand Total Section */}
                        <div className="border-t border-slate-200 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Thank you for your patronage!</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Computer generated receipt, valid without signature.</p>
                            </div>
                            <div className="w-full sm:w-auto text-left sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:block justify-between items-center">
                                <span className="text-xs text-slate-400 block font-medium uppercase">Grand Total</span>
                                <span className="text-lg sm:text-xl font-black text-slate-900">₦{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full sm:flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}