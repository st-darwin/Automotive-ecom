import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { database, appwriteConfig } from '../../appwrite/Client';
import { ShoppingCart, Heart, Package, Search, Filter } from 'lucide-react';
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
    type: 'tyres' | 'grease' | 'motorParts';
}

export const Loader = async() =>{
    try{
     const user = await getCurrentUser()
     return user
    }
    
    catch(e){
  console.log("Unable to fetch user id / session"  ,e)
    }
}

export default function CustomerProducts() {
    const [activeTab, setActiveTab] = useState<'tyres' | 'grease' | 'motorParts'>('tyres');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [cart, setCart] = useState<Product[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const user = useLoaderData() as {$id : string}

    // Placeholder user ID — update this if you pull it from your auth session
  const userId = user.$id


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

                // Fetch initial user cart state to keep the local state/count synced without changing UI structure
                const cartResponse = await database.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.cartCollection || 'cart',
                    [Query.equal('userId', userId)]
                );
                
                // Reconstruct simple product representation array for UI state count compatibility
                const loadedCartItems: Product[] = [];
                cartResponse.documents.forEach((doc: any) => {
                    for (let i = 0; i < (doc.quantity || 1); i++) {
                        loadedCartItems.push({
                            $id: doc.productId,
                            name: doc.name,
                            brand: '',
                            price: doc.price,
                            stock: 99,
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

    const toggleFavorite = (id: string) => {
        setFavorites(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const addToCart = async (product: Product) => {
        try {
            const cartCollectionId = appwriteConfig.cartCollection || 'cart';

            // Check if this product is already in the database cart for this user
            const existingItems = await database.listDocuments(
                appwriteConfig.databaseId,
                cartCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('productId', product.$id)
                ]
            );

            if (existingItems.documents.length > 0) {
                // Update existing row quantity
                const existingDoc = existingItems.documents[0];
                const newQuantity = (existingDoc.quantity || 1) + 1;

                await database.updateDocument(
                    appwriteConfig.databaseId,
                    cartCollectionId,
                    existingDoc.$id,
                    { quantity: newQuantity }
                );
            } else {
                // Create new cart entry matching your database schema structure
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
                        quantity: 1,
                        imageUrl: product.imageUrl || '',
                        sizeOrVolume: product.size || product.volume || ''
                    }
                );
            }

            // Update local state so UI updates instantly
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
            {/* Header Section */}
            <div className="flex flex-col gap-4">
         <Header
        title="Kinchris Switch Enterprise ⚡"
        description="Browse our curated catalog of elite automotive tyres, industrial-grade lubricants, and precision-engineered motor parts."
        ctaText={`View Cart (${cart.length})`}
        ctaUrl="cart"
/>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-center sm:justify-start gap-3 animate-bounce text-xs font-semibold">
                    <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{notification}</span>
                </div>
            )}

            {/* Category Tabs (Scrollable on Mobile) */}
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
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-3xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group relative"
                        >
                            {/* Favorite Button */}
                            <button
                                onClick={() => toggleFavorite(product.$id)}
                                className="absolute top-6 right-6 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                                aria-label="Save to favorites"
                            >
                                <Heart className={`w-4 h-4 ${favorites[product.$id] ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                            </button>

                            <div>
                                {/* Product Image */}
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

                                {/* Meta details */}
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
                                    onClick={() => addToCart(product)}
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
        </div>
    );
}