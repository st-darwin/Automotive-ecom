import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Plus, MoreVertical, Edit3, Trash2, Disc, Search } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface Tyre {
    $id: string;
    name: string;
    brand: string;
    size: string;
    category: string;
    price: number;
    stock: number;
    imageUrl: string;
    storeId: string;
    treadPattern: string;
    year: number;
}

const TyrePage = () => {
    const navigate = useNavigate();
    const [tyres, setTyres] = useState<Tyre[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTyres = async () => {
        try {
            setLoading(true);
            const response = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.tyreColection,
            );
            setTyres(response.documents as unknown as Tyre[]);
        } catch (error) {
            console.error('Error fetching tyres:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTyres();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this tyre?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.tyreColection,
                id
            );
            setTyres(prev => prev.filter(t => t.$id !== id));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting tyre:', error);
        }
    };

    const handleEdit = (tyre: Tyre, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/inventory/tyres/create', { state: { tyreToEdit: tyre } });
    };

    // Filter tyres based on search query (matches name, brand, size, category, or year)
    const filteredTyres = tyres.filter((tyre) => {
        const query = searchQuery.toLowerCase();
        return (
            tyre.name?.toLowerCase().includes(query) ||
            tyre.brand?.toLowerCase().includes(query) ||
            tyre.size?.toLowerCase().includes(query) ||
            tyre.category?.toLowerCase().includes(query) ||
            String(tyre.year)?.toLowerCase().includes(query)
        );
    });

    // Reusable image or fallback element renderer
    const renderTyreMedia = (tyre: Tyre, isMobile: boolean = false) => {
        const dimensions = isMobile ? "w-12 h-12 rounded-2xl" : "w-10 h-10 rounded-xl";
        const iconSize = isMobile ? "w-6 h-6" : "w-5 h-5";

        if (tyre.imageUrl && tyre.imageUrl.trim() !== '') {
            return (
                <img 
                    src={tyre.imageUrl} 
                    alt={tyre.name} 
                    className={`${dimensions} object-cover border border-slate-200/80 bg-slate-100 flex-shrink-0`} 
                />
            );
        }

        return (
            <div className={`${dimensions} bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0`}>
                <Disc className={iconSize} />
            </div>
        );
    };

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Header
                    title="Mega Tyre Inventory"
                    description="Manage radial tyres, treads, pricing, and specialized stock allocations."
                />
                <button
                    onClick={() => navigate('/inventory/tyres/create')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Tyre</span>
                </button>
            </div>

            {/* Search Bar Filter Row */}
            <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name, brand, size, category, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : filteredTyres.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 sm:p-16 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Disc className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-semibold text-slate-900">
                            {tyres.length === 0 ? "No tyres in inventory" : "No matching tyres found"}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            {tyres.length === 0 
                                ? "Get started by creating your first tyre product with pricing, specs, and tread patterns."
                                : `No results found for "${searchQuery}". Try searching with a different keyword.`}
                        </p>
                    </div>
                    {tyres.length === 0 && (
                        <button
                            onClick={() => navigate('/inventory/tyres/create')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Tyre</span>
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Mobile & Tablet Card View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                        {filteredTyres.map((tyre) => (
                            <div 
                                key={tyre.$id}
                                onClick={(e) => handleEdit(tyre, e)}
                                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs space-y-4 cursor-pointer hover:border-slate-300 transition-all relative group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {renderTyreMedia(tyre, true)}
                                        <div>
                                            <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                                                {tyre.name}
                                            </h4>
                                            <p className="text-xs text-slate-500">{tyre.brand} &bull; <span className="font-mono">{tyre.size}</span></p>
                                        </div>
                                    </div>

                                    {/* Mobile Dropdown Action */}
                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === tyre.$id ? null : tyre.$id);
                                            }}
                                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {activeDropdown === tyre.$id && (
                                            <div className="absolute right-0 top-10 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                <button
                                                    onClick={(e) => handleEdit(tyre, e)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                                    <span>Edit Tyre</span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(tyre.$id, e)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                    <span>Delete Tyre</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-[11px]">
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Year</span>
                                        <span className="font-semibold text-slate-900 block">{tyre.year || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Category</span>
                                        <span className="font-semibold text-blue-600 uppercase truncate block">{tyre.category}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Price</span>
                                        <span className="font-semibold text-slate-900 block">₦{tyre.price?.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Stock</span>
                                        <span className={`font-semibold ${tyre.stock > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {tyre.stock} units
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="py-4 px-6">Product</th>
                                        <th className="py-4 px-6">Brand / Size</th>
                                        <th className="py-4 px-6">Year</th>
                                        <th className="py-4 px-6">Category</th>
                                        <th className="py-4 px-6">Tread Pattern</th>
                                        <th className="py-4 px-6">Price</th>
                                        <th className="py-4 px-6">Stock</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                    {filteredTyres.map((tyre) => (
                                        <tr 
                                            key={tyre.$id} 
                                            onClick={(e) => handleEdit(tyre, e)}
                                            className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {renderTyreMedia(tyre, false)}
                                                    <div>
                                                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {tyre.name}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 font-mono">ID: {tyre.$id.slice(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-0.5">
                                                    <p className="text-slate-900 font-semibold">{tyre.brand}</p>
                                                    <span className="text-[11px] text-slate-400">{tyre.size}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-slate-900">
                                                {tyre.year || 'N/A'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100/60 uppercase">
                                                    {tyre.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-700">
                                                {tyre.treadPattern || 'Standard'}
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-slate-900">
                                                ₦{tyre.price?.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                    tyre.stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${tyre.stock > 5 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {tyre.stock} units
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right relative" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === tyre.$id ? null : tyre.$id);
                                                    }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {activeDropdown === tyre.$id && (
                                                    <div className="absolute right-6 top-14 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                        <button
                                                            onClick={(e) => handleEdit(tyre, e)}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>Edit Tyre</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(tyre.$id, e)}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                            <span>Delete Tyre</span>
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
                </>
            )}
        </div>
    );
};

export default TyrePage;