import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
    ArrowLeft, 
    Warehouse, 
    Plus, 
    Trash2, 
    Search, 
    MapPin, 
    Layers, 
    CircleDot,
    X,
    ChevronRight,
    Store as StoreIcon,
    Package
} from 'lucide-react';
import { appwriteConfig, database } from '../../appwrite/Client';

interface TyreDocument {
    $id: string;
    name: string;
    brand: string;
    size: string;
    stock: number;
}

interface WarehouseStore {
    $id: string;
    $createdAt: string;
    name: string;
    totalRows: number;
}

interface StoreAssignment {
    $id: string;
    $createdAt: string;
    storeId: string;
    storeName: string;
    rowNumber: string; 
    position: string;  
    tyreId: string;
    tyreName: string;
    brand: string;
    size: string;
}

const TIER_POSITIONS = ['Top', 'Middle', 'Down'];

const ParkingStore = () => {
    const navigate = useNavigate();
    
    // Core data states
    const [stores, setStores] = useState<WarehouseStore[]>([]);
    const [assignments, setAssignments] = useState<StoreAssignment[]>([]);
    const [tyres, setTyres] = useState<TyreDocument[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation & View Flow State
    const [selectedStore, setSelectedStore] = useState<WarehouseStore | null>(null);
    const [selectedRow, setSelectedRow] = useState<string | null>(null);

    // Modals
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreRows, setNewStoreRows] = useState<number>(5);

    const [selectedPosition, setSelectedPosition] = useState(TIER_POSITIONS[0]);
    const [selectedTyreId, setSelectedTyreId] = useState('');
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [storesRes, assignmentsRes, tyresRes] = await Promise.all([
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.parkingStoresCollection || 'parking-stores'),
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.parkingAssignmentsCollection || 'parking-assignments'),
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.tyreColection || 'tyres')
            ]);

            setStores(storesRes.documents as unknown as WarehouseStore[]);
            setAssignments(assignmentsRes.documents as unknown as StoreAssignment[]);
            setTyres(tyresRes.documents as unknown as TyreDocument[]);
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStoreName) return;

        try {
            setSubmitting(true);
            const newDoc = await database.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.parkingStoresCollection || 'parking-stores',
                'unique()',
                {
                    name: newStoreName,
                    totalRows: Number(newStoreRows) || 5
                }
            );

            setStores(prev => [newDoc as unknown as WarehouseStore, ...prev]);
            setIsStoreModalOpen(false);
            setNewStoreName('');
            setNewStoreRows(5);
        } catch (error) {
            console.error('Error creating store:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStore = async (storeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Deleting this store will also remove all its row inventory assignments. Continue?')) return;

        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.parkingStoresCollection || 'parking-stores',
                storeId
            );
            setStores(prev => prev.filter(s => s.$id !== storeId));
            if (selectedStore?.$id === storeId) {
                setSelectedStore(null);
                setSelectedRow(null);
            }
        } catch (error) {
            console.error('Error deleting store:', error);
        }
    };

    const handleAssignTyre = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore || !selectedRow || !selectedTyreId) return;

        const chosenTyre = tyres.find(t => t.$id === selectedTyreId);

        try {
            setSubmitting(true);
            const newAssignment = await database.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.parkingAssignmentsCollection || 'parking-assignments',
                'unique()',
                {
                    storeId: selectedStore.$id,
                    storeName: selectedStore.name,
                    rowNumber: selectedRow,
                    position: selectedPosition,
                    tyreId: selectedTyreId,
                    tyreName: chosenTyre?.name || 'Assigned Tyre',
                    brand: chosenTyre?.brand || 'Generic',
                    size: chosenTyre?.size || 'Standard'
                }
            );

            setAssignments(prev => [newAssignment as unknown as StoreAssignment, ...prev]);
            setIsAssignModalOpen(false);
            setSelectedTyreId('');
            setSelectedPosition(TIER_POSITIONS[0]);
        } catch (error) {
            console.error('Error assigning tyre:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!window.confirm('Remove tyre from this position?')) return;
        try {
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.parkingAssignmentsCollection || 'parking-assignments',
                assignmentId
            );
            setAssignments(prev => prev.filter(a => a.$id !== assignmentId));
        } catch (error) {
            console.error('Error deleting assignment:', error);
        }
    };

    const tyreStockMap = useMemo(() => {
        const map = new Map<string, number>();
        tyres.forEach(t => map.set(t.$id, t.stock ?? 0));
        return map;
    }, [tyres]);

    const searchResults = useMemo(() => {
        if (!globalSearchQuery.trim()) return [];
        const query = globalSearchQuery.toLowerCase();
        return assignments.filter(a => 
            a.tyreName?.toLowerCase().includes(query) ||
            a.brand?.toLowerCase().includes(query) ||
            a.size?.toLowerCase().includes(query) ||
            a.storeName?.toLowerCase().includes(query) ||
            a.rowNumber?.toLowerCase().includes(query)
        );
    }, [assignments, globalSearchQuery]);

    const storeRows = useMemo(() => {
        if (!selectedStore) return [];
        const rows = [];
        for (let i = 1; i <= selectedStore.totalRows; i++) {
            rows.push(i === 1 ? 'Row 1 (Last Row)' : `Row ${i}`);
        }
        return rows;
    }, [selectedStore]);

    const currentAssignmentsInRow = useMemo(() => {
        if (!selectedStore || !selectedRow) return [];
        return assignments.filter(a => a.storeId === selectedStore.$id && a.rowNumber === selectedRow);
    }, [assignments, selectedStore, selectedRow]);

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {/* Header & Navigation Breadcrumb */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <button
                        onClick={() => {
                            if (selectedRow) setSelectedRow(null);
                            else if (selectedStore) setSelectedStore(null);
                            else navigate('/orders');
                        }}
                        className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <Header
                            title={
                                selectedRow ? `${selectedStore?.name} › ${selectedRow}` :
                                selectedStore ? `${selectedStore.name} Layout` :
                                "Warehouse Parking Stores"
                            }
                            description={
                                selectedRow ? "Manage vertical slot tiers and assigned tyres." :
                                selectedStore ? "Select a row rack to manage slot assignments." :
                                "Manage independent storage facilities and rack layouts."
                            }
                        />
                    </div>
                </div>

                {!selectedStore ? (
                    <button
                        onClick={() => setIsStoreModalOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Store</span>
                    </button>
                ) : selectedRow ? (
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Assign Tyre to Position</span>
                    </button>
                ) : null}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                </div>
            ) : !selectedStore ? (
                /* VIEW 1: Store Selection List + Global Tyre Search */
                <div className="space-y-6">
                    {/* Search Bar for Tyres across warehouse */}
                    <div className="bg-white/80 backdrop-blur-xl p-4 border border-slate-200/60 rounded-3xl shadow-2xs space-y-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search tyre model, brand, store, or row..."
                                value={globalSearchQuery}
                                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-16 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {globalSearchQuery && (
                                <button 
                                    onClick={() => setGlobalSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Search Results Panel */}
                        {globalSearchQuery && (
                            <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3 sm:p-4 space-y-3">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Search Results ({searchResults.length} found)
                                </span>
                                {searchResults.length === 0 ? (
                                    <p className="text-xs text-slate-500 py-2">No assigned tyres match your search query.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {searchResults.map((item) => {
                                            const stockCount = tyreStockMap.get(item.tyreId) ?? 0;
                                            return (
                                                <div key={item.$id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                                            <CircleDot className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                            <span className="truncate">{item.tyreName}</span>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex-shrink-0">
                                                            <Package className="w-3 h-3" />
                                                            Stock: {stockCount}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 truncate">{item.brand} • Size: {item.size}</p>
                                                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                                                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg truncate">
                                                            📍 {item.storeName} › {item.rowNumber}
                                                        </span>
                                                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                                            Tier: {item.position}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {stores.length === 0 ? (
                        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-2xs">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                                <Warehouse className="w-7 h-7" />
                            </div>
                            <div className="space-y-1 max-w-sm mx-auto">
                                <h3 className="text-base font-semibold text-slate-900">No warehouse stores found</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">Create your first storage facility to begin organizing rack layouts.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {stores.map((store) => (
                                <div
                                    key={store.$id}
                                    onClick={() => setSelectedStore(store)}
                                    className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <StoreIcon className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteStore(store.$id, e)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                            title="Delete Store"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-4 space-y-1">
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{store.name}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                                            {store.totalRows} Rack Rows Configured
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                                        <span>View Store Layout</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : !selectedRow ? (
                /* VIEW 2: Store Layout - Select Row */
                <div className="space-y-6">
                    <div className="bg-white/60 backdrop-blur-xl p-4 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">Select a row rack in {selectedStore.name}:</span>
                        <span className="text-[11px] text-slate-400 font-medium">Total Rows: {selectedStore.totalRows}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {storeRows.map((rowName) => {
                            const rowAssignmentsCount = assignments.filter(a => a.storeId === selectedStore.$id && a.rowNumber === rowName).length;
                            return (
                                <div
                                    key={rowName}
                                    onClick={() => setSelectedRow(rowName)}
                                    className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                            {rowAssignmentsCount} items assigned
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{rowName}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Click to view vertical tiers</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* VIEW 3: Row Positions & Tyre Assignments with Stock Display */
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xs overflow-hidden">
                        <div className="bg-slate-50/80 px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">Slots for {selectedRow}</span>
                            <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">Assigned: {currentAssignmentsInRow.length}</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {TIER_POSITIONS.map((tier) => {
                                const assignment = currentAssignmentsInRow.find(a => a.position === tier);
                                const stockCount = assignment ? (tyreStockMap.get(assignment.tyreId) ?? 0) : 0;

                                return (
                                    <div key={tier} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                                assignment ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {tier[0]}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{tier} Position</h4>
                                                {assignment ? (
                                                    <div className="mt-1 space-y-1">
                                                        <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                                                            <CircleDot className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                            <span className="truncate">{assignment.tyreName} ({assignment.brand} - {assignment.size})</span>
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                                <Package className="w-3 h-3" />
                                                                Stock: {stockCount}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400 truncate">ID: {assignment.tyreId}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic mt-0.5">Empty slot (No tyre assigned)</p>
                                                )}
                                            </div>
                                        </div>

                                        {assignment && (
                                            <button
                                                onClick={() => handleDeleteAssignment(assignment.$id)}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer flex-shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Remove Tyre</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create Store */}
            {isStoreModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-6 mx-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Create Warehouse Store</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Define a new independent parking storage facility.</p>
                            </div>
                            <button onClick={() => setIsStoreModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStore} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Store Facility Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Main Warehouse Store"
                                    value={newStoreName}
                                    onChange={(e) => setNewStoreName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Total Rack Rows</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="15"
                                    required
                                    value={newStoreRows}
                                    onChange={(e) => setNewStoreRows(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">Row 1 will automatically be designated as the Last Row.</span>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsStoreModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50">
                                    {submitting ? 'Creating...' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Assign Existing Tyre */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-6 mx-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Assign Tyre to {selectedRow}</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Select a vertical tier position and link an existing tyre catalog item.</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignTyre} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Vertical Tier Slot</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {TIER_POSITIONS.map((tier) => (
                                        <button
                                            type="button"
                                            key={tier}
                                            onClick={() => setSelectedPosition(tier)}
                                            className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                                selectedPosition === tier ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tier}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Select Existing Tyre & Stock</label>
                                <select
                                    required
                                    value={selectedTyreId}
                                    onChange={(e) => setSelectedTyreId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer truncate"
                                >
                                    <option value="">-- Choose Existing Tyre --</option>
                                    {tyres.map((tyre) => (
                                        <option key={tyre.$id} value={tyre.$id}>
                                            {tyre.name} ({tyre.brand} - Size: {tyre.size}) [Stock: {tyre.stock ?? 0}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50">
                                    {submitting ? 'Assigning...' : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParkingStore;