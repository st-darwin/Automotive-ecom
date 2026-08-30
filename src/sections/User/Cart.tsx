import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { database, appwriteConfig } from '../../appwrite/Client';
import { getCurrentUser } from '../../appwrite/Auth';
import { Trash2, Package, ArrowRight, MessageSquare, CreditCard } from 'lucide-react';
import { Query, ID } from 'appwrite';
import { usePaystackPayment } from 'react-paystack';

interface CartItem {
    $id: string;
    userId: string;
    productId: string;
    productType: 'tyres' | 'grease' | 'motorParts';
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    sizeOrVolume?: string;
    brand?: string;
    category?: string;
}

export default function Cart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'tyres' | 'grease' | 'motorParts'>('tyres');
    const [user, setUser] = useState<any>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

    useEffect(() => {
        const fetchUserDataAndCart = async () => {
            setLoading(true);
            try {
                const currentUser = await getCurrentUser();
                if (currentUser && currentUser.$id) {
                    setUser(currentUser);
                    const response = await database.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.cartCollection || 'cart',
                        [Query.equal('userId', currentUser.$id)]
                    );
                    setCartItems(response.documents as unknown as CartItem[]);
                }
            } catch (error) {
                console.error('Error fetching cart items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndCart();
    }, []);

    const updateQuantity = async (documentId: string, currentQuantity: number, change: number) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity <= 0) {
            removeItem(documentId);
            return;
        }

        try {
            await database.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.cartCollection || 'cart',
                documentId,
                { quantity: newQuantity }
            );

            setCartItems(prev =>
                prev.map(item =>
                    item.$id === documentId ? { ...item, quantity: newQuantity } : item
                )
            );
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const removeItem = async (documentId: string) => {
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.cartCollection || 'cart',
                documentId
            );

            setCartItems(prev => prev.filter(item => item.$id !== documentId));
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    // Filter items based on the active tab and current verified userId
    const filteredCartItems = cartItems.filter(
        item => item.productType === activeTab && (!user?.$id || item.userId === user.$id)
    );

    const subtotal = filteredCartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

    // Paystack Configuration
    const paystackConfig = {
        reference: new Date().getTime().toString(),
        email: user?.email || 'customer@automotivestore.com',
        amount: subtotal * 100, // Paystack amount is in kobo
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key_here',
    };

    const initializePaystackPayment = usePaystackPayment(paystackConfig);

    const handlePaymentSuccess = async (reference: any) => {
        setIsProcessingPayment(true);
        try {
            const customerName = user?.name || 'Valued Customer';
            const accountId = user?.$id;

            for (const item of filteredCartItems) {
                const unitPrice = item.price || 0;
                const quantity = item.quantity || 1;
                const totalPrice = unitPrice * quantity;

                // 1. Create Order in the appropriate collection based on activeTab
                if (activeTab === 'tyres') {
                    await database.createDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.tyreOrdersCollecton|| 'tyre-order',
                        ID.unique(),
                        {
                            customerName,
                            tyreName: item.name,
                            brand: item.brand || 'Generic',
                            size: item.sizeOrVolume || 'Standard',
                            unitPrice,
                            quantity,
                            totalPrice,
                            paymentStatus: 'paid',
                            accountId
                        }
                    );

                    // Reduce stock in inventory (tyreCollection)
                    try {
                        const productDoc = await database.getDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.tyreColection || 'tyres',
                            item.productId
                        );
                        const currentStock = productDoc.stock ?? productDoc.quantity ?? 0;
                        const newStock = Math.max(0, currentStock - quantity);
                        await database.updateDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.tyreColection || 'tyres',
                            item.productId,
                            { stock: newStock }
                        );
                    } catch (err) {
                        console.error('Error updating tyre stock:', err);
                    }

                } else if (activeTab === 'grease') {
                    await database.createDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.greaseOrdersCollection || 'grease-order',
                        ID.unique(),
                        {
                            customerName,
                            greaseName: item.name,
                            brand: item.brand || 'Generic',
                            volume: item.sizeOrVolume || 'Standard',
                            unitPrice,
                            quantity,
                            totalPrice,
                            paymentStatus: 'paid',
                            accountId
                        }
                    );

                    // Reduce stock in inventory (greaseCollection)
                    try {
                        const productDoc = await database.getDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.greaseCollection || 'grease',
                            item.productId
                        );
                        const currentStock = productDoc.stock ?? productDoc.quantity ?? 0;
                        const newStock = Math.max(0, currentStock - quantity);
                        await database.updateDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.greaseCollection || 'grease',
                            item.productId,
                            { stock: newStock }
                        );
                    } catch (err) {
                        console.error('Error updating grease stock:', err);
                    }

                } else if (activeTab === 'motorParts') {
                    await database.createDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.motorPartsOrdersCollection || 'motorParts-order',
                        ID.unique(),
                        {
                            customerName,
                            partName: item.name,
                            brand: item.brand || 'Generic',
                            category: item.category || 'General',
                            unitPrice,
                            quantity,
                            totalPrice,
                            paymentStatus: 'paid',
                            accountId
                        }
                    );

                    // Reduce stock in inventory (motorPartsCollection)
                    try {
                        const productDoc = await database.getDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.motorPartsCollection || 'motorParts',
                            item.productId
                        );
                        const currentStock = productDoc.stock ?? productDoc.quantity ?? 0;
                        const newStock = Math.max(0, currentStock - quantity);
                        await database.updateDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.motorPartsCollection || 'motorParts',
                            item.productId,
                            { stock: newStock }
                        );
                    } catch (err) {
                        console.error('Error updating motor parts stock:', err);
                    }
                }

                // 2. Remove checked out item from cart
                await database.deleteDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.cartCollection || 'cart',
                    item.$id
                );
            }

            // Refresh cart state
            setCartItems(prev => prev.filter(item => item.productType !== activeTab));
            alert('Payment successful! Your order has been placed and inventory updated.');
        } catch (error) {
            console.error('Error processing post-payment actions:', error);
            alert('Payment was successful, but there was an error saving your order. Please contact support.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleCheckout = () => {
        if (subtotal <= 0) return;
        initializePaystackPayment({
            onSuccess: handlePaymentSuccess,
            onClose: () => console.log('Payment closed'),
        });
    };

    const handleWhatsAppNegotiation = () => {
        const phoneNumber = '2348068200125';
        const categoryName = activeTab === 'tyres' ? 'Tyres' : activeTab === 'grease' ? 'Grease & Lubricants' : 'Motor Parts';
        
        let message = `Hello! I would like to negotiate prices for the following items in my cart under *${categoryName}*:\n\n`;
        
        filteredCartItems.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* (Qty: ${item.quantity}) - ₦${((item.price || 0) * item.quantity).toLocaleString()}\n`;
            if (item.sizeOrVolume) message += `   Spec: ${item.sizeOrVolume}\n`;
        });

        message += `\n*Category Subtotal: ₦${subtotal.toLocaleString()}*\n`;
        message += `Please, let's discuss a custom discount or bulk pricing arrangement.`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div id="cart" className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-20 pt-4">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <Header
                    title="Your Shopping Cart 🛒"
                    description="Manage your selected tyres, industrial lubricants, and motor components securely before checkout."
                    ctaText="Back to Catalog"
                    ctaUrl="/Customer"
                />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
                {[
                    { id: 'tyres', label: 'Tyres' },
                    { id: 'grease', label: 'Grease & Lubricants' },
                    { id: 'motorParts', label: 'Motor Parts' }
                ].map(tab => {
                    const count = cartItems.filter(item => item.productType === tab.id && (!user?.$id || item.userId === user.$id)).length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Cart Content */}
            {loading || isProcessingPayment ? (
                <div className="space-y-4">
                    {isProcessingPayment && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-xs font-semibold text-center animate-pulse">
                            Processing payment and updating your orders & inventory...
                        </div>
                    )}
                    {[1, 2].map(n => (
                        <div key={n} className="bg-white/60 border border-slate-200/60 rounded-3xl h-24 animate-pulse" />
                    ))}
                </div>
            ) : filteredCartItems.length === 0 ? (
                <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-12 text-center text-slate-500 text-xs space-y-3">
                    <Package className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-700">No items found in this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredCartItems.map(item => (
                            <div
                                key={item.$id}
                                className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-4 transition-all"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.name}>
                                            {item.name}
                                        </h3>
                                        {item.sizeOrVolume && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">Spec: {item.sizeOrVolume}</p>
                                        )}
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                                            ₦{(item.price || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                                        <button
                                            onClick={() => updateQuantity(item.$id, item.quantity, -1)}
                                            className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer text-xs font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="px-3 text-xs font-semibold text-slate-800">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.$id, item.quantity, 1)}
                                            className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer text-xs font-bold"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.$id)}
                                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary & Paystack Checkout Box */}
                    <div className="space-y-4">
                        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-3xl p-6 shadow-sm h-fit space-y-4">
                            <h3 className="text-sm font-bold text-slate-900">Cart Summary</h3>
                            <div className="space-y-2 text-xs text-slate-600 border-b border-slate-100 pb-4">
                                <div className="flex justify-between">
                                    <span>Selected Category Subtotal</span>
                                    <span className="font-semibold text-slate-900">₦{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Category Items</span>
                                    <span className="font-semibold text-slate-900">{filteredCartItems.reduce((a, b) => a + b.quantity, 0)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                                <span>Total</span>
                                <span>₦{subtotal.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={filteredCartItems.length === 0 || isProcessingPayment}
                                className={`w-full py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                                    filteredCartItems.length > 0
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Pay with Paystack (₦{subtotal.toLocaleString()})</span>
                            </button>
                        </div>

                        {/* WhatsApp Negotiation Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-md space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold">Want a Custom Price?</h4>
                                    <p className="text-[11px] text-emerald-100">Negotiate bulk discounts directly via WhatsApp.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleWhatsAppNegotiation}
                                disabled={filteredCartItems.length === 0}
                                className={`w-full py-2.5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    filteredCartItems.length > 0
                                        ? 'bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 shadow-sm'
                                        : 'bg-white/40 text-white/70 cursor-not-allowed'
                                }`}
                            >
                                <span>Negotiate on WhatsApp</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}