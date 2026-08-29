import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

import { appwriteConfig , database , storage } from '../../appwrite/Client';
import { ID } from 'appwrite';

const CreateTyre = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const tyreToEdit = location.state?.tyreToEdit || null;

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        size: '',
        category: 'all-season',
        price: '',
        stock: '',
        imageUrl: '',
        treadPattern: '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (tyreToEdit) {
            setFormData({
                name: tyreToEdit.name || '',
                brand: tyreToEdit.brand || '',
                size: tyreToEdit.size || '',
                category: tyreToEdit.category || 'all-season',
                price: tyreToEdit.price ? String(tyreToEdit.price) : '',
                stock: tyreToEdit.stock ? String(tyreToEdit.stock) : '',
                imageUrl: tyreToEdit.imageUrl || '',
                treadPattern: tyreToEdit.treadPattern || '',
            });
            if (tyreToEdit.imageUrl) {
                setImagePreview(tyreToEdit.imageUrl);
            }
        }
    }, [tyreToEdit]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let uploadedImageUrl = formData.imageUrl;

            // Handle image upload if a new file was dropped/selected
      if (imageFile) {
     const uploadedFile = await storage.createFile(appwriteConfig.storageId, ID.unique(), imageFile);
     
     // Manual string construction using your Appwrite config endpoint and project
     uploadedImageUrl = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.storageId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.project}`;
}
            const payload = {
                name: formData.name,
                brand: formData.brand,
                size: formData.size,
                category: formData.category,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock, 10) || 0,
                imageUrl: uploadedImageUrl,
                treadPattern: formData.treadPattern,
            };

            if (tyreToEdit) {
                // Update document
                await database.updateDocument(
                    appwriteConfig.databaseId, 
                    appwriteConfig.tyreColection,
                     tyreToEdit.$id, payload);
            } else {
                // Create document
                 await database.createDocument(
                    appwriteConfig.databaseId,
                     appwriteConfig.tyreColection,
                     ID.unique(), payload);
            }

            navigate('/inventory/tyres');
        } catch (error) {
            console.error('Error saving tyre:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-16">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/inventory/tyres')}
                    className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <Header
                    title={tyreToEdit ? 'Edit Tyre' : 'Create Tyre'}
                    description={tyreToEdit ? 'Update product parameters and inventory stock.' : 'Add a brand new tyre specification to the catalog.'}
                />
            </div>

            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 space-y-6 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Product Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 205/55R16 Michelin Pilot"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Manufacturer Brand</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Michelin"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Tyre Size</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 205/55R16"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        >
                            <option value="all-season">All-Season</option>
                            <option value="summer">Summer</option>
                            <option value="heavy-duty">Heavy-Duty</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Price (₦)</label>
                        <input
                            type="number"
                            required
                            placeholder="45000"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Stock Quantity</label>
                        <input
                            type="number"
                            required
                            placeholder="12"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Tread Pattern (Teeth Style)</label>
                    <input
                        type="text"
                        placeholder="e.g. Directional V-Block, Block Lug, Ribbed"
                        value={formData.treadPattern}
                        onChange={(e) => setFormData({ ...formData, treadPattern: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Product Image</label>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center ${
                            isDragging ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50'
                        }`}
                    >
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview('');
                                        setFormData({ ...formData, imageUrl: '' });
                                    }}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 py-4">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-700">
                                        Drag & drop tyre image here, or <label className="text-blue-600 cursor-pointer hover:underline">browse</label>
                                    </p>
                                    <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/inventory/tyres')}
                        className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{tyreToEdit ? 'Update Tyre' : 'Save Tyre'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTyre;