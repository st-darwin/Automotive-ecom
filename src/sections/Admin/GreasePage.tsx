import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Plus, MoreVertical, Edit3, Trash2, Droplet, Search } from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface Grease {
    $id: string;
    name: string;
    brand: string;
    volume: string;
    price: number;
    stock: number;
    imageUrl: string;
    year: string;
}

const GreasePage = () => {
    const navigate = useNavigate();
    const [greases, setGreases] = useState<Grease[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchGreases = async () => {
        try {
            setLoading(true);
            const response = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.greaseCollection, // Make sure this is defined in your Appwrite config
            );
            setGreases(response.documents as unknown as Grease[]);
        } catch (error) {
            console.error('Error fetching grease inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGreases();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this grease product?')) return;
        
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.greaseCollection,
                id
            );
            setGreases(prev => prev.filter(g => g.$id !== id));
            setActiveDropdown(null);
        } catch (error) {
            console.error('Error deleting grease item:', error);
        }
    };

    const handleEdit = (grease: Grease, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/inventory/grease/create', { state: { greaseToEdit: grease } });
    };

    // Filter grease items based on search query
    const filteredGreases = greases.filter((grease) => {
        const query = searchQuery.toLowerCase();
        return (
            grease.name?.toLowerCase().includes(query) ||
            grease.brand?.toLowerCase().includes(query) ||
            grease.volume?.toLowerCase().includes(query) ||
            String(grease.year)?.toLowerCase().includes(query)
        );
    });

    const renderGreaseMedia = (grease: Grease, isMobile: boolean = false) => {
        const dimensions = isMobile ? "w-12 h-12 rounded-2xl" : "w-10 h-10 rounded-xl";
        const iconSize = isMobile ? "w-6 h-6" : "w-5 h-5";

        if (grease.imageUrl && grease.imageUrl.trim() !== '') {
            return (
                <img 
                    src={grease.imageUrl} 
                    alt={grease.name} 
                    className={`${dimensions} object-cover border border-slate-200/80 bg-slate-100 flex-shrink-0`} 
                />
            );
        }

        return (
            <div className={`${dimensions} bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0`}>
                <Droplet className={iconSize} />
            </div>
        );
    };

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" onClick={() => setActiveDropdown(null)}>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Header
                    title="Grease Inventory"
                    description="Manage Boothman and local grease brands, stock volumes, and pricing."
                />
                <button
                    onClick={() => navigate('/inventory/grease/create')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Grease</span>
                </button>
            </div>

            {/* Search Bar Filter Row */}
            <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name, brand, volume, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : filteredGreases.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 sm:p-16 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Droplet className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-semibold text-slate-900">
                            {greases.length === 0 ? "No grease items in inventory" : "No matching grease items found"}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            {greases.length === 0 
                                ? "Get started by creating your first grease product with volume, brand, pricing, and year details."
                                : `No results found for "${searchQuery}". Try searching with a different keyword.`}
                        </p>
                    </div>
                    {greases.length === 0 && (
                        <button
                            onClick={() => navigate('/inventory/grease/create')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Grease</span>
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Mobile & Tablet Card View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                        {filteredGreases.map((grease) => (
                            <div 
                                key={grease.$id}
                                onClick={(e) => handleEdit(grease, e)}
                                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-2xs space-y-4 cursor-pointer hover:border-slate-300 transition-all relative group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {renderGreaseMedia(grease, true)}
                                        <div>
                                            <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                                                {grease.name}
                                            </h4>
                                            <p className="text-xs text-slate-500">{grease.brand} &bull; <span className="font-mono">{grease.volume}</span></p>
                                        </div>
                                    </div>

                                    {/* Mobile Dropdown Action */}
                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === grease.$id ? null : grease.$id);
                                            }}
                                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {activeDropdown === grease.$id && (
                                            <div className="absolute right-0 top-10 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                <button
                                                    onClick={(e) => handleEdit(grease, e)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                                    <span>Edit Item</span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(grease.$id, e)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                    <span>Delete Item</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-[11px]">
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Year</span>
                                        <span className="font-semibold text-slate-900 block">{grease.year || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Brand</span>
                                        <span className="font-semibold text-amber-600 truncate block">{grease.brand}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Price</span>
                                        <span className="font-semibold text-slate-900 block">₦{grease.price?.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">Stock</span>
                                        <span className={`font-semibold ${grease.stock > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {grease.stock} units
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
                                        <th className="py-4 px-6">Brand / Volume</th>
                                        <th className="py-4 px-6">Year</th>
                                        <th className="py-4 px-6">Price</th>
                                        <th className="py-4 px-6">Stock</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                    {filteredGreases.map((grease) => (
                                        <tr 
                                            key={grease.$id} 
                                            onClick={(e) => handleEdit(grease, e)}
                                            className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {renderGreaseMedia(grease, false)}
                                                    <div>
                                                        <p className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                                                            {grease.name}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 font-mono">ID: {grease.$id.slice(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-0.5">
                                                    <p className="text-slate-900 font-semibold">{grease.brand}</p>
                                                    <span className="text-[11px] text-slate-400">{grease.volume}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-slate-900">
                                                {grease.year || 'N/A'}
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-slate-900">
                                                ₦{grease.price?.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                    grease.stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${grease.stock > 5 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {grease.stock} units
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right relative" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === grease.$id ? null : grease.$id);
                                                    }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {activeDropdown === grease.$id && (
                                                    <div className="absolute right-6 top-14 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                                                        <button
                                                            onClick={(e) => handleEdit(grease, e)}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>Edit Item</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(grease.$id, e)}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                            <span>Delete Item</span>
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

export default GreasePage;