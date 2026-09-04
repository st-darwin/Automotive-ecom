import React, { useState, useEffect } from 'react';
import { database, appwriteConfig } from '../../appwrite/Client';
import { ID } from 'appwrite';
import { Package, Wrench, Disc, CheckCircle2, AlertCircle, ShoppingCart, ArrowRight, Layers, Sparkles, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';

export default function ManualEntering() {
    const [activeTab, setActiveTab] = useState<'tyres' | 'grease' | 'motorParts'>('tyres');
    
    // Form States
    const [customerName, setCustomerName] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [customUnitPrice, setCustomUnitPrice] = useState<number | ''>('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');

    // Available Products fetched from DB
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch products based on the active tab
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setSelectedProduct(null);
            setCustomUnitPrice('');
            try {
                let collectionId = '';
                if (activeTab === 'tyres') collectionId = appwriteConfig.tyreColection || 'tyres';
                else if (activeTab === 'grease') collectionId = appwriteConfig.greaseCollection || 'grease';
                else if (activeTab === 'motorParts') collectionId = appwriteConfig.motorPartsCollection || 'motorParts';

                const response = await database.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId
                );
                setProducts(response.documents);
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeTab]);

    // Handle product selection and auto-fill
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        const product = products.find(p => p.$id === productId);
        setSelectedProduct(product || null);
        
        // Auto-populate the unit price input with the selected product's default price
        if (product) {
            const defaultPrice = product.price || product.unitPrice || 0;
            setCustomUnitPrice(defaultPrice);
        } else {
            setCustomUnitPrice('');
        }
    };

    // Calculate effective unit price and total price
    const unitPrice = customUnitPrice !== '' ? Number(customUnitPrice) : (selectedProduct?.price || selectedProduct?.unitPrice || 0);
    const totalPrice = unitPrice * quantity;
    const currentStock = selectedProduct?.stock || selectedProduct?.quantity || 0;

    // Handle form submission and stock deduction
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !selectedProduct) {
            setErrorMessage("Please fill in all required fields and select a product.");
            return;
        }

        if (quantity > currentStock) {
            setErrorMessage(`Insufficient stock available. Only ${currentStock} left in inventory.`);
            return;
        }

        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            let targetCollection = '';
            let productCollection = '';
            let payload: any = {
                customerName,
                unitPrice: Number(unitPrice),
                quantity: Number(quantity),
                totalPrice: Number(totalPrice),
                paymentStatus,
                accountId: "admin-manual-entry" 
            };

            if (activeTab === 'tyres') {
                targetCollection = appwriteConfig.tyreOrdersCollecton || 'tyre-order';
                productCollection = appwriteConfig.tyreColection || 'tyres';
                payload = {
                    ...payload,
                    tyreName: selectedProduct.name || selectedProduct.tyreName,
                    brand: selectedProduct.brand,
                    size: selectedProduct.size,
                };
            } else if (activeTab === 'grease') {
                targetCollection = appwriteConfig.greaseOrdersCollection || 'grease-order';
                productCollection = appwriteConfig.greaseCollection || 'grease';
                payload = {
                    ...payload,
                    greaseName: selectedProduct.name || selectedProduct.greaseName,
                    brand: selectedProduct.brand,
                    volume: selectedProduct.volume,
                };
            } else if (activeTab === 'motorParts') {
                targetCollection = appwriteConfig.motorPartsOrdersCollection || 'motorparts-order';
                productCollection = appwriteConfig.motorPartsCollection || 'motorParts';
                payload = {
                    ...payload,
                    partName: selectedProduct.name || selectedProduct.partName,
                    brand: selectedProduct.brand,
                    category: selectedProduct.category || 'General',
                };
            }

            // 1. Create the order document
            await database.createDocument(
                appwriteConfig.databaseId,
                targetCollection,
                ID.unique(),
                payload
            );

            // 2. Deduct from available inventory stock field
            const updatedStock = Math.max(0, currentStock - Number(quantity));
            const stockFieldKey = selectedProduct.stock !== undefined ? 'stock' : 'quantity';

            await database.updateDocument(
                appwriteConfig.databaseId,
                productCollection,
                selectedProduct.$id,
                { [stockFieldKey]: updatedStock }
            );

            setSuccessMessage("Manual order recorded successfully and stock updated!");
            
            // Refresh local product list state with updated stock value
            setProducts(prev => prev.map(p => p.$id === selectedProduct.$id ? { ...p, [stockFieldKey]: updatedStock } : p));
            setSelectedProduct(prev => prev ? { ...prev, [stockFieldKey]: updatedStock } : null);
            setCustomerName('');
            setQuantity(1);
            setCustomUnitPrice('');
            setPaymentStatus('paid');
        } catch (error: any) {
            console.error("Error saving manual order:", error);
            setErrorMessage(error.message || "Failed to record order.");
        } finally {
            setSubmitting(false);
        }
    };

    const getTabMeta = () => {
        if (activeTab === 'tyres') return { label: 'Tyre Inventory', color: 'text-rose-600 bg-rose-50/80 border-rose-200/60' };
        if (activeTab === 'grease') return { label: 'Grease Inventory', color: 'text-amber-600 bg-amber-50/80 border-amber-200/60' };
        return { label: 'Motor Parts Inventory', color: 'text-blue-600 bg-blue-50/80 border-blue-200/60' };
    };

    const tabMeta = getTabMeta();

    return (
        <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24 font-sans selection:bg-slate-900 selection:text-white">
            <Header 
                title="Walk-In Management"
                description="Process counter sales and sync live store inventories effortlessly."
                ctaText="View All Orders"
                ctaUrl="/orders"
            />

            <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-10">
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-5 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl mb-6 sm:mb-8 relative overflow-hidden border border-slate-800/80">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-white/10 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-indigo-300 mb-2 sm:mb-3 backdrop-blur-xl border border-white/10 shadow-inner">
                            <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" /> Admin Point of Sale
                        </span>
                        <h1 className="text-xl sm:text-4xl font-black tracking-tight mb-1.5 sm:mb-2">Manual Order & Stock Entry</h1>
                        <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                            Log physical walk-in customer purchases. Submitting automatically deducts items from your active inventory.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-4 sm:p-10 transition-all">
                    
                    {/* Navigation Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-100/80 rounded-xl sm:rounded-2xl mb-6 border border-slate-200/60">
                        <button
                            type="button"
                            onClick={() => setActiveTab('tyres')}
                            className={`py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                activeTab === 'tyres' 
                                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-900/5 scale-[1.02]' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
                            }`}
                        >
                            <Disc className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 ${activeTab === 'tyres' ? 'text-rose-500 rotate-180' : 'text-slate-400'}`} />
                            <span className="truncate">Tyres</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('grease')}
                            className={`py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                activeTab === 'grease' 
                                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-900/5 scale-[1.02]' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
                            }`}
                        >
                            <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 ${activeTab === 'grease' ? 'text-amber-500 scale-110' : 'text-slate-400'}`} />
                            <span className="truncate">Grease</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('motorParts')}
                            className={`py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                                activeTab === 'motorParts' 
                                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-900/5 scale-[1.02]' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
                            }`}
                        >
                            <Wrench className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 ${activeTab === 'motorParts' ? 'text-blue-500 rotate-45' : 'text-slate-400'}`} />
                            <span className="truncate">Parts</span>
                        </button>
                    </div>

                    {/* Active Catalog Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 sm:mb-8 px-3.5 sm:px-4 py-3 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-inner">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Catalog:</span>
                        </div>
                        <span className={`text-[11px] sm:text-xs font-extrabold px-3 py-1 rounded-full border shadow-xs transition-colors self-start sm:self-auto ${tabMeta.color}`}>
                            {tabMeta.label}
                        </span>
                    </div>

                    {/* Alerts */}
                    {successMessage && (
                        <div className="mb-6 p-3.5 sm:p-4 bg-emerald-50/90 border border-emerald-200 text-emerald-800 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-start sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xs">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" /> 
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-6 p-3.5 sm:p-4 bg-rose-50/90 border border-rose-200 text-rose-800 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-start sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xs">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" /> 
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Customer Full Name</label>
                            <input
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="e.g., Emeka Johnson"
                                className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-50/50 border border-slate-200/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-2xs"
                            />
                        </div>

                        {/* Product Combo Box */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Select {activeTab === 'tyres' ? 'Tyre Item' : activeTab === 'grease' ? 'Grease Item' : 'Motor Part'}
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    onChange={handleProductChange}
                                    disabled={loading}
                                    value={selectedProduct?.$id || ''}
                                    className="w-full appearance-none px-3.5 sm:px-4 py-3 sm:py-3.5 pr-10 rounded-xl sm:rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white cursor-pointer transition-all shadow-2xs truncate"
                                >
                                    <option value="" className="text-slate-400">
                                        {loading ? "Loading available inventory..." : "-- Choose from products --"}
                                    </option>
                                    {products.map((item) => {
                                        const stockCount = item.stock !== undefined ? item.stock : (item.quantity !== undefined ? item.quantity : 0);
                                        return (
                                            <option key={item.$id} value={item.$id} disabled={stockCount <= 0} className="py-2">
                                                {item.name || item.tyreName || item.greaseName || item.partName} — {item.brand} ({item.size || item.volume || item.category || 'Standard'}) — ₦{(item.price || item.unitPrice)?.toLocaleString()} [Stock: {stockCount}] {stockCount <= 0 ? '(Out of Stock)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronDown className="w-4 h-4 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl sm:rounded-2xl border border-slate-200/70 space-y-3 shadow-inner">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Auto-Filled Specifications
                                </div>
                                {selectedProduct && (
                                    <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs self-start sm:self-auto ${currentStock > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' : 'bg-rose-100 text-rose-800 border border-rose-200/50'}`}>
                                        Available Stock: {currentStock} units
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Brand</span>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedProduct?.brand || ''}
                                        placeholder="—"
                                        className="w-full px-3 py-2.5 bg-white/90 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 cursor-not-allowed shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                                        {activeTab === 'tyres' ? 'Size' : activeTab === 'grease' ? 'Volume' : 'Category'}
                                    </span>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedProduct?.size || selectedProduct?.volume || selectedProduct?.category || ''}
                                        placeholder="—"
                                        className="w-full px-3 py-2.5 bg-white/90 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 cursor-not-allowed shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-slate-700 font-bold mb-1">Unit Price (₦)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={customUnitPrice}
                                        onChange={(e) => setCustomUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="₦0"
                                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quantity to Purchase</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={currentStock || 1}
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-50/50 border border-slate-200/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-2xs"
                                />
                            </div>

                            {/* Payment Status Combo Box */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Status</label>
                                <div className="relative">
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'pending')}
                                        className="w-full appearance-none px-3.5 sm:px-4 py-3 sm:py-3.5 pr-10 rounded-xl sm:rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white cursor-pointer transition-all shadow-2xs"
                                    >
                                        <option value="paid">Paid (Immediate Settlement)</option>
                                        <option value="pending">Pending (On Credit)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown className="w-4 h-4 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Summary Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-800">
                            <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Calculated Price</span>
                                <span className="text-xs text-slate-300 font-medium">({quantity} item{quantity > 1 ? 's' : ''} × ₦{unitPrice.toLocaleString()})</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-emerald-400 drop-shadow-sm self-end sm:self-auto">₦{totalPrice.toLocaleString()}</span>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || (selectedProduct && currentStock <= 0)}
                            className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {submitting ? (
                                "Recording Order & Updating Stock..."
                            ) : (
                                <>
                                    Record Order 📃 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}