import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { database, appwriteConfig } from '../../appwrite/Client';
import { ShoppingCart, Heart, Package, Search, Filter, X } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { getCurrentUser } from '../../appwrite/Auth';
import { useLoaderData } from 'react-router-dom';

interface Product {
    $id: string;
    name: string;
    brand: string;
    price: number;
    stock: number;
    imageUrl?: string;
    size?: string;
    volume?: string;
    category?: string;
    year?: string;
    treadPattern?: string;
    type: 'tyres' | 'grease' | 'motorParts';
}

export const Loader = async () => {
    try {
        const user = await getCurrentUser();
        return user;
    } catch (e) {
        console.log("Unable to fetch user id / session", e);
    }
};

export default function CustomerProducts() {
    const [activeTab, setActiveTab] = useState<'tyres' | 'grease' | 'motorParts'>('tyres');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [cart, setCart] = useState<Product[]>([]);
    const [notification, setNotification] = useState<string | null>(null);

    // Modal Details State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [modalLoading, setModalLoading] = useState<boolean>(false);

    const user = useLoaderData() as { $id: string };
    const userId = user.$id;

    useEffect(() => {
        const fetchProductsAndCart = async () => {
            setLoading(true);
            try {
                let collectionId = '';
                let typeKey: 'tyres' | 'grease' | 'motorParts' = 'tyres';

                if (activeTab === 'tyres') {
                    collectionId = appwriteConfig.tyreColection || 'tyres';
                    typeKey = 'tyres';
                } else if (activeTab === 'grease') {
                    collectionId = appwriteConfig.greaseCollection || 'grease';
                    typeKey = 'grease';
                } else {
                    collectionId = appwriteConfig.motorPartsCollection || 'motorParts';
                    typeKey = 'motorParts';
                }

                const response = await database.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId
                );

                const formatted: Product[] = response.documents.map((doc: any) => ({
                    ...doc,
                    type: typeKey
                }));

                setProducts(formatted);

                const cartResponse = await database.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.cartCollection || 'cart',
                    [Query.equal('userId', userId)]
                );
                
                const loadedCartItems: Product[] = [];
                cartResponse.documents.forEach((doc: any) => {
                    for (let i = 0; i < (doc.quantity || 1); i++) {
                        loadedCartItems.push({
                            $id: doc.productId,
                            name: doc.name,
                            brand: doc.brand,
                            price: doc.price,
                            stock: doc.stock,
                            type: doc.productType
                        });
                    }
                });
                setCart(loadedCartItems);

            } catch (error) {
                console.error(`Error fetching ${activeTab}:`, error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProductsAndCart();
    }, [activeTab]);

    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleCardClick = async (productId: string) => {
        setModalLoading(true);
        try {
            let collectionId = appwriteConfig.tyreColection || 'tyres';
            if (activeTab === 'grease') {
                collectionId = appwriteConfig.greaseCollection || 'grease';
            } else if (activeTab === 'motorParts') {
                collectionId = appwriteConfig.motorPartsCollection || 'motorParts';
            }

            const doc = await database.getDocument(
                appwriteConfig.databaseId,
                collectionId,
                productId
            );

            setSelectedProduct({
                ...(doc as unknown as Product),
                type: activeTab
            });
        } catch (error) {
            console.error('Error fetching full product details:', error);
            setNotification('Could not load full product specifications.');
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setModalLoading(false);
        }
    };

    const addToCart = async (product: Product, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const cartCollectionId = appwriteConfig.cartCollection || 'cart';

            const existingItems = await database.listDocuments(
                appwriteConfig.databaseId,
                cartCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('productId', product.$id)
                ]
            );

            if (existingItems.documents.length > 0) {
                const existingDoc = existingItems.documents[0];
                const newQuantity = (existingDoc.quantity || 1) + 1;

                await database.updateDocument(
                    appwriteConfig.databaseId,
                    cartCollectionId,
                    existingDoc.$id,
                    { quantity: newQuantity }
                );
            } else {
                await database.createDocument(
                    appwriteConfig.databaseId,
                    cartCollectionId,
                    ID.unique(),
                    {
                        userId: userId,
                        productId: product.$id,
                        productType: product.type,
                        name: product.name,
                        price: product.price,
                        brand: product.brand,
                        quantity: 1,
                        imageUrl: product.imageUrl || '',
                        sizeOrVolume: product.size || product.volume || ''
                    }
                );
            }

            setCart(prev => [...prev, product]);
            setNotification(`Added ${product.name} to cart!`);
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error saving item to cart collection:', error);
            setNotification('Failed to update cart.');
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const filteredProducts = products.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-20 pt-4">
            <div className="flex flex-col gap-4">
                <Header
                    title="Kinchris Switch Enterprise ⚡"
                    description="Browse our curated catalog of elite automotive tyres, industrial-grade lubricants, and precision-engineered motor parts."
                    ctaText={`View Cart (${cart.length})`}
                    ctaUrl="cart"
                />
            </div>

            {notification && (
                <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce text-xs font-semibold">
                    <div className="flex items-center gap-3 truncate">
                        <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{notification}</span>
                    </div>
                    <button 
                        onClick={() => setNotification(null)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        aria-label="Close notification"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Category Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
                {[
                    { id: 'tyres', label: 'Tyre Collection' },
                    { id: 'grease', label: 'Grease & Lubricants' },
                    { id: 'motorParts', label: 'Motor Parts' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            setSelectedCategory('all');
                        }}
                        className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                            activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-white/80 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl border border-slate-200/60 shadow-2xs">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name or brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                {categories.length > 1 && (
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-500 shrink-0">Filter:</span>
                        <div className="flex gap-1.5 overflow-x-auto">
                            {categories.map((cat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedCategory(cat as string)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                                        selectedCategory === cat
                                            ? 'bg-slate-200 text-slate-900'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="bg-white/60 border border-slate-200/60 rounded-3xl h-72 animate-pulse" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-12 text-center text-slate-500 text-xs space-y-3">
                    <Package className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-700">No products found in this collection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map(product => (
                        <div
                            key={product.$id}
                            onClick={() => handleCardClick(product.$id)}
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group relative cursor-pointer"
                        >
                            <button
                                onClick={(e) => toggleFavorite(product.$id, e)}
                                className="absolute top-6 right-6 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                                aria-label="Save to favorites"
                            >
                                <Heart className={`w-4 h-4 ${favorites[product.$id] ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                            </button>

                            <div>
                                <div className="w-full h-44 sm:h-48 rounded-2xl bg-slate-100 overflow-hidden mb-3 sm:mb-4 relative">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <Package className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        {product.brand}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                    <span className="truncate max-w-[60%]">{product.category || product.type}</span>
                                    <span>Stock: <strong className={product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>{product.stock}</strong></span>
                                </div>

                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate mb-1" title={product.name}>
                                    {product.name}
                                </h3>

                                <div className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4 flex flex-wrap gap-x-2">
                                    {product.size && <span>Size: {product.size}</span>}
                                    {product.volume && <span>Volume: {product.volume}</span>}
                                    {product.year && <span>Year: {product.year}</span>}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Price</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-900">₦{(product.price || 0).toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={(e) => addToCart(product, e)}
                                    disabled={product.stock <= 0}
                                    className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-2xl font-semibold text-xs transition-colors shadow-xs cursor-pointer shrink-0 ${
                                        product.stock > 0
                                            ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Details Modal */}
          {/* Product Details Modal */}
{(selectedProduct || modalLoading) && (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
                type="button"
                onClick={() => {
                    setSelectedProduct(null);
                    setModalLoading(false);
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer z-10"
                aria-label="Close modal"
            >
                <X className="w-4 h-4" />
            </button>

            {modalLoading ? (
                <div className="py-16 text-center space-y-3 animate-pulse">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Loading full specifications...</p>
                </div>
            ) : selectedProduct && (
                <>
                    <div className="w-full h-56 rounded-2xl bg-slate-100 overflow-hidden relative">
                        {selectedProduct.imageUrl ? (
                            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-12 h-12" />
                            </div>
                        )}
                        <span className="absolute bottom-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            {selectedProduct.brand}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                            {selectedProduct.category || selectedProduct.type}
                        </span>
                        <h2 className="text-lg font-extrabold text-slate-900">{selectedProduct.name}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                        <div>
                            <span className="text-slate-400 block font-medium">Brand</span>
                            <strong className="text-slate-800">{selectedProduct.brand || 'N/A'}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Price</span>
                            <strong className="text-slate-900">₦{(selectedProduct.price || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Stock Available</span>
                            <strong className={selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {selectedProduct.stock} units
                            </strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Size / Volume</span>
                            <strong className="text-slate-800">{selectedProduct.size || selectedProduct.volume || 'N/A'}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Year</span>
                            <strong className="text-slate-800">{selectedProduct.year || 'N/A'}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Tread Pattern</span>
                            <strong className="text-slate-800">{selectedProduct.treadPattern || 'Standard'}</strong>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            addToCart(selectedProduct, e);
                            setSelectedProduct(null);
                            setModalLoading(false);
                        }}
                        disabled={selectedProduct.stock <= 0}
                        className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                            selectedProduct.stock > 0
                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart - ₦{(selectedProduct.price || 0).toLocaleString()}</span>
                    </button>
                </>
            )}
        </div>
    </div>
)}
        </div>
    );
}