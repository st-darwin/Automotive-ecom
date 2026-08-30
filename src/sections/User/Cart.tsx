import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { database, appwriteConfig } from '../../appwrite/Client';
import { getCurrentUser } from '../../appwrite/Auth';
import { Trash2,  Package, ArrowRight } from 'lucide-react';
import { Query } from 'appwrite';

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
}

export default function Cart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'tyres' | 'grease' | 'motorParts'>('tyres');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserDataAndCart = async () => {
            setLoading(true);
            try {
                const user = await getCurrentUser();
                if (user && user.$id) {
                    setUserId(user.$id);
                    const response = await database.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.cartCollection || 'cart',
                        [Query.equal('userId', user.$id)]
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
        item => item.productType === activeTab && (!userId || item.userId === userId)
    );

    const subtotal = filteredCartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

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
                    const count = cartItems.filter(item => item.productType === tab.id && (!userId || item.userId === userId)).length;
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
            {loading ? (
                <div className="space-y-4">
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

                    {/* Order Summary Box */}
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
                            disabled={filteredCartItems.length === 0}
                            className={`w-full py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                                filteredCartItems.length > 0
                                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <span>Proceed to Checkout</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}