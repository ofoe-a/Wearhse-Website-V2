import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, Save, Image, Upload, X, GripVertical } from 'lucide-react';
import { fetchAdminProduct, createProduct, updateProduct, updateVariant, addVariants, addImages, deleteImage, toggleHeroImage, uploadImages, reorderColors } from './services/adminApi';
import { resolveImageUrl } from '../utils/imageUrl';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Generate SKU — e.g. "GTTW-WHI-XL" (first letter of each word + 3-letter color + size)
function generateSku(productName: string, colorName: string, size: string): string {
    const namePart = productName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]+/g, '')
        .trim()
        .split(/\s+/)
        .map(w => w[0])
        .join('');
    const colorPart = colorName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 3);
    return [namePart, colorPart, size].filter(Boolean).join('-');
}

// ── Types ──────────────────────────────────────────

interface ColorOption {
    name: string;
    hex: string;
}

interface VariantData {
    id?: string; // set if the variant already exists in DB
    pricePesewas: number;
    stock: number;
}

interface ImageRow {
    id?: string;
    url: string;
    altText: string;
    colorName: string;
    sortOrder: number;
    hero?: boolean;
}

// ── Component ──────────────────────────────────────

const ProductForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Product fields
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [featured, setFeatured] = useState(false);
    const [active, setActive] = useState(true);
    const [details, setDetails] = useState<string[]>(['']);

    // Shopify-style options
    const [colors, setColors] = useState<ColorOption[]>([]);
    const [enabledSizes, setEnabledSizes] = useState<Set<string>>(new Set(ALL_SIZES));

    // Variant data keyed by "colorName|size"
    const [variantMap, setVariantMap] = useState<Record<string, VariantData>>({});

    // Images
    const [images, setImages] = useState<ImageRow[]>([]);

    // ── Load existing product ──

    useEffect(() => {
        if (!isEdit) return;
        fetchAdminProduct(id!)
            .then(data => {
                setName(data.name);
                setSlug(data.slug);
                setDescription(data.description || '');
                setCategory(data.category || '');
                setFeatured(data.featured);
                setActive(data.active);
                setDetails(data.details.map((d: any) => d.detail) || ['']);

                // Extract colors and sizes from existing variants, preserving sort_order
                const colorMap = new Map<string, { hex: string; sortOrder: number }>();
                const sizeSet = new Set<string>();
                const vMap: Record<string, VariantData> = {};

                for (const v of (data.variants || [])) {
                    if (!colorMap.has(v.colorName)) {
                        colorMap.set(v.colorName, { hex: v.colorHex, sortOrder: v.sortOrder ?? 0 });
                    }
                    sizeSet.add(v.size);
                    vMap[`${v.colorName}|${v.size}`] = {
                        id: v.id,
                        pricePesewas: v.pricePesewas,
                        stock: v.stock,
                    };
                }

                // Sort colors by sortOrder so they appear in the correct order
                const sortedColors = Array.from(colorMap.entries())
                    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
                    .map(([n, d]) => ({ name: n, hex: d.hex }));
                setColors(sortedColors);
                setEnabledSizes(sizeSet.size > 0 ? sizeSet : new Set(ALL_SIZES));
                setVariantMap(vMap);

                setImages(data.images.map((i: any) => ({
                    ...i,
                    altText: i.altText || '',
                    colorName: i.colorName || '',
                })) || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    // ── Auto-generate slug ──

    useEffect(() => {
        if (!isEdit) {
            setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    }, [name, isEdit]);

    // Color names for image dropdown — include colors from variants + any already on images
    const colorNames = useMemo(() => {
        const names = new Set<string>();
        for (const c of colors) if (c.name) names.add(c.name);
        for (const img of images) if (img.colorName) names.add(img.colorName);
        return Array.from(names);
    }, [colors, images]);

    // ── Computed variants (Color × Size) ──

    const computedVariants = useMemo(() => {
        const result: { colorName: string; colorHex: string; size: string; sku: string; data: VariantData }[] = [];
        const sizesArr = ALL_SIZES.filter(s => enabledSizes.has(s));

        for (const color of colors) {
            for (const size of sizesArr) {
                const key = `${color.name}|${size}`;
                const existing = variantMap[key];
                result.push({
                    colorName: color.name,
                    colorHex: color.hex,
                    size,
                    sku: generateSku(name, color.name, size),
                    data: existing || { pricePesewas: 0, stock: 0 },
                });
            }
        }
        return result;
    }, [colors, enabledSizes, variantMap, name]);

    // ── Color helpers ──

    const addColor = () => {
        setColors([...colors, { name: '', hex: '#000000' }]);
    };

    const updateColor = (idx: number, field: keyof ColorOption, value: string) => {
        const old = colors[idx];
        const updated = [...colors];
        updated[idx] = { ...updated[idx], [field]: value };
        setColors(updated);

        // If renaming, migrate variant data keys
        if (field === 'name' && old.name !== value) {
            setVariantMap(prev => {
                const next = { ...prev };
                for (const size of ALL_SIZES) {
                    const oldKey = `${old.name}|${size}`;
                    const newKey = `${value}|${size}`;
                    if (next[oldKey]) {
                        next[newKey] = next[oldKey];
                        delete next[oldKey];
                    }
                }
                return next;
            });
        }
    };

    const removeColor = (idx: number) => {
        const color = colors[idx];
        setColors(colors.filter((_, i) => i !== idx));
        // Clean up variant data for removed color
        setVariantMap(prev => {
            const next = { ...prev };
            for (const size of ALL_SIZES) {
                delete next[`${color.name}|${size}`];
            }
            return next;
        });
    };

    // ── Drag-and-drop color reorder ──
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const handleDragStart = (idx: number) => {
        setDragIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        setDragOverIdx(idx);
    };

    const handleDrop = (idx: number) => {
        if (dragIdx === null || dragIdx === idx) {
            setDragIdx(null);
            setDragOverIdx(null);
            return;
        }
        const updated = [...colors];
        const [dragged] = updated.splice(dragIdx, 1);
        updated.splice(idx, 0, dragged);
        setColors(updated);

        // If editing an existing product, persist the new order to DB immediately
        if (isEdit && id) {
            reorderColors(id, updated.map(c => c.name)).catch(console.error);
        }

        setDragIdx(null);
        setDragOverIdx(null);
    };

    const handleDragEnd = () => {
        setDragIdx(null);
        setDragOverIdx(null);
    };

    // ── Size toggle ──

    const toggleSize = (size: string) => {
        setEnabledSizes(prev => {
            const next = new Set(prev);
            if (next.has(size)) {
                if (next.size > 1) next.delete(size); // keep at least one
            } else {
                next.add(size);
            }
            return next;
        });
    };

    // ── Variant data update ──

    const updateVariantData = (colorName: string, size: string, field: keyof VariantData, value: number) => {
        const key = `${colorName}|${size}`;
        setVariantMap(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value },
        }));
    };

    // Batch update: set same price for all variants of a color
    const setColorPrice = (colorName: string, pricePesewas: number) => {
        setVariantMap(prev => {
            const next = { ...prev };
            for (const size of ALL_SIZES) {
                const key = `${colorName}|${size}`;
                next[key] = { ...next[key], pricePesewas };
            }
            return next;
        });
    };

    // ── Image helpers ──

    const addImage = () => {
        setImages([...images, { url: '', altText: '', colorName: '', sortOrder: images.length }]);
    };

    const updateImageField = (idx: number, field: keyof ImageRow, value: any) => {
        const updated = [...images];
        (updated[idx] as any)[field] = value;
        setImages(updated);
    };

    const removeImage = async (idx: number) => {
        const img = images[idx];
        // If image exists in DB, delete it from backend
        if (img.id) {
            try {
                await deleteImage(img.id);
            } catch (err) {
                console.error('Failed to delete image:', err);
                return; // Don't remove from UI if backend delete failed
            }
        }
        setImages(images.filter((_, i) => i !== idx));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError('');

        try {
            const results = await uploadImages(Array.from(files));

            const newImages: ImageRow[] = results.map((r, i) => ({
                url: r.url,  // Store relative path only, e.g. "/uploads/abc.jpg"
                altText: '',
                colorName: '',
                sortOrder: images.length + i,
            }));

            setImages([...images, ...newImages]);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // ── Save ──

    const handleSave = async () => {
        setError('');
        setSaving(true);

        try {
            if (isEdit) {
                await updateProduct(id!, {
                    name, description, category, featured, active,
                    details: details.filter(d => d.trim()),
                });

                // Update existing variants + collect new ones
                const newVariants = [];
                for (const v of computedVariants) {
                    if (v.data.id) {
                        await updateVariant(v.data.id, { stock: v.data.stock, pricePesewas: v.data.pricePesewas });
                    } else {
                        newVariants.push({
                            colorName: v.colorName,
                            colorHex: v.colorHex,
                            size: v.size,
                            pricePesewas: v.data.pricePesewas,
                            sku: v.sku,
                            stock: v.data.stock,
                            sortOrder: colors.findIndex(c => c.name === v.colorName),
                        });
                    }
                }

                // Create new variants
                if (newVariants.length > 0) {
                    await addVariants(id!, newVariants);
                }

                // Create new images (ones without an id)
                const newImages = images.filter(i => !i.id && i.url).map(i => ({
                    url: i.url,
                    altText: i.altText || null,
                    colorName: i.colorName || null,
                    sortOrder: i.sortOrder,
                }));
                if (newImages.length > 0) {
                    await addImages(id!, newImages);
                }
            } else {
                await createProduct({
                    name,
                    slug,
                    description,
                    category,
                    featured,
                    variants: computedVariants.map(v => ({
                        colorName: v.colorName,
                        colorHex: v.colorHex,
                        size: v.size,
                        pricePesewas: v.data.pricePesewas,
                        sku: v.sku,
                        stock: v.data.stock,
                        sortOrder: colors.findIndex(c => c.name === v.colorName),
                    })),
                    images: images.filter(i => i.url).map(i => ({
                        url: i.url,
                        altText: i.altText || null,
                        colorName: i.colorName || null,
                        sortOrder: i.sortOrder,
                    })),
                    details: details.filter(d => d.trim()),
                });
            }

            navigate('/admin/products');
        } catch (err: any) {
            setError(err.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    // ── Loading state ──

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    // ── Render ──

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Link to="/admin/products" className="p-1.5 rounded-lg hover:bg-ink/5 transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="font-display text-xl uppercase">{isEdit ? 'Edit Product' : 'New Product'}</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !name}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider bg-ink text-bone hover:bg-ink/85 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                    <p className="font-mono text-[13.5px] text-red-600">{error}</p>
                </div>
            )}

            <div className="space-y-8 max-w-3xl">
                {/* ── Basic Info ── */}
                <section className="border border-ink/8 rounded-xl p-5 space-y-5">
                    <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Basic Info</h2>

                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-transparent border-b border-ink/15 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                                placeholder="Product name"
                            />
                        </div>
                        <div>
                            <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Slug</label>
                            <input
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                disabled={isEdit}
                                className="w-full bg-transparent border-b border-ink/15 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25 disabled:text-ink/30"
                                placeholder="product-slug"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-transparent border border-ink/10 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/25 resize-none"
                            placeholder="Product description"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block mb-2">Category</label>
                            <input
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-transparent border-b border-ink/15 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/50 transition-colors placeholder:text-ink/25"
                                placeholder="e.g. T-Shirts"
                            />
                        </div>
                        <div className="flex items-end gap-6 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 rounded border-ink/20 accent-ink" />
                                <span className="font-mono text-[13.5px] text-ink/60">Featured</span>
                            </label>
                            {isEdit && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded border-ink/20 accent-ink" />
                                    <span className="font-mono text-[13.5px] text-ink/60">Active</span>
                                </label>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Options (Colors + Sizes) ── */}
                <section className="border border-ink/8 rounded-xl p-5 space-y-6">
                    <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Options</h2>

                    {/* Colors */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40">Colors</label>
                            <button
                                onClick={addColor}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11.5px] uppercase tracking-wider border border-ink/10 hover:bg-ink/5 transition-colors"
                            >
                                <Plus size={12} />
                                Add Color
                            </button>
                        </div>

                        {colors.length === 0 && (
                            <p className="text-center py-3 font-mono text-[13.5px] text-ink/25">No colors yet. Add one to get started.</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {colors.map((color, idx) => (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDrop={() => handleDrop(idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-1.5 border rounded-full pl-1.5 pr-2 py-1 cursor-grab active:cursor-grabbing transition-all ${
                                        dragIdx === idx
                                            ? 'opacity-40 border-ink/20'
                                            : dragOverIdx === idx
                                                ? 'border-ink/40 bg-ink/5 scale-105'
                                                : 'border-ink/10 hover:border-ink/20'
                                    }`}
                                >
                                    <GripVertical size={12} className="text-ink/20 flex-shrink-0" />
                                    <input
                                        type="color"
                                        value={color.hex}
                                        onChange={e => updateColor(idx, 'hex', e.target.value)}
                                        className="w-6 h-6 rounded-full border border-ink/10 cursor-pointer"
                                    />
                                    <input
                                        value={color.name}
                                        onChange={e => updateColor(idx, 'name', e.target.value)}
                                        placeholder="Color name"
                                        className="bg-transparent w-24 font-mono text-[13.5px] focus:outline-none placeholder:text-ink/25"
                                    />
                                    <button
                                        onClick={() => removeColor(idx)}
                                        className="p-0.5 text-ink/25 hover:text-red-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sizes */}
                    <div className="space-y-3">
                        <label className="font-mono text-[11.5px] uppercase tracking-widest text-ink/40 block">Sizes</label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_SIZES.map(size => (
                                <button
                                    key={size}
                                    onClick={() => toggleSize(size)}
                                    className={`px-4 py-2 rounded-full font-mono text-[13.5px] uppercase tracking-wider border transition-colors ${
                                        enabledSizes.has(size)
                                            ? 'bg-ink text-bone border-ink'
                                            : 'border-ink/15 text-ink/30 hover:border-ink/30'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Variants (auto-generated) ── */}
                {computedVariants.length > 0 && (
                    <section className="border border-ink/8 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">
                                Variants
                                <span className="ml-2 text-ink/20">({computedVariants.length})</span>
                            </h2>
                        </div>

                        {/* Group by color */}
                        {colors.filter(c => c.name).map(color => {
                            const colorVariants = computedVariants.filter(v => v.colorName === color.name);
                            if (colorVariants.length === 0) return null;

                            return (
                                <div key={color.name} className="border border-ink/5 rounded-lg p-4 space-y-3">
                                    {/* Color header with batch price */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-ink/10" style={{ backgroundColor: color.hex }} />
                                            <span className="font-mono text-sm font-medium">{color.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[9px] uppercase tracking-widest text-ink/30">Set all prices</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-20 bg-transparent border-b border-ink/10 py-1 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/20 text-right"
                                                onBlur={e => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val) && val > 0) {
                                                        setColorPrice(color.name, Math.round(val * 100));
                                                        e.target.value = '';
                                                    }
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Header row */}
                                    <div className="grid grid-cols-[3rem_1fr_5rem_4rem] gap-3 px-1">
                                        {['Size', 'SKU', 'Price', 'Stock'].map(h => (
                                            <span key={h} className="font-mono text-[9px] uppercase tracking-widest text-ink/30">{h}</span>
                                        ))}
                                    </div>

                                    {/* Variant rows */}
                                    {colorVariants.map(v => (
                                        <div key={`${v.colorName}-${v.size}`} className="grid grid-cols-[3rem_1fr_5rem_4rem] gap-3 items-center">
                                            <span className="font-mono text-[13.5px] font-medium">{v.size}</span>
                                            <span className="font-mono text-[12px] text-ink/40 truncate" title={v.sku}>
                                                {v.sku || '—'}
                                            </span>
                                            <input
                                                type="number"
                                                value={v.data.pricePesewas / 100 || ''}
                                                onChange={e => updateVariantData(v.colorName, v.size, 'pricePesewas', Math.round(parseFloat(e.target.value || '0') * 100))}
                                                placeholder="0.00"
                                                className="bg-transparent border-b border-ink/10 py-1 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/20"
                                            />
                                            <input
                                                type="number"
                                                value={v.data.stock || ''}
                                                onChange={e => updateVariantData(v.colorName, v.size, 'stock', parseInt(e.target.value || '0'))}
                                                placeholder="0"
                                                className="bg-transparent border-b border-ink/10 py-1 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/20"
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        })}

                        {/* Show unnamed colors warning */}
                        {colors.some(c => !c.name) && (
                            <p className="font-mono text-[13.5px] text-amber-600 text-center py-2">
                                Name all colors above to see their variants
                            </p>
                        )}
                    </section>
                )}

                {/* ── Images ── */}
                <section className="border border-ink/8 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Images</h2>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11.5px] uppercase tracking-wider border border-ink/10 hover:bg-ink/5 transition-colors cursor-pointer">
                                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {uploading ? 'Uploading...' : 'Upload'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                            <button
                                onClick={addImage}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11.5px] uppercase tracking-wider border border-ink/10 hover:bg-ink/5 transition-colors"
                            >
                                <Plus size={12} />
                                URL
                            </button>
                        </div>
                    </div>

                    {images.map((img, idx) => (
                        <div key={idx} className="border border-ink/5 rounded-lg p-3 space-y-2">
                            <div className="flex gap-3 items-start">
                                {img.url && (
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-ink/5 flex-shrink-0">
                                        <img src={resolveImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 grid sm:grid-cols-[1fr_8rem] gap-3">
                                    <div>
                                        <label className="font-mono text-[9px] uppercase tracking-widest text-ink/30 block mb-1">URL</label>
                                        <input
                                            value={img.url}
                                            onChange={e => updateImageField(idx, 'url', e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-transparent border-b border-ink/10 py-1.5 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-mono text-[9px] uppercase tracking-widest text-ink/30 block mb-1">Color</label>
                                        <select
                                            value={img.colorName}
                                            onChange={e => updateImageField(idx, 'colorName', e.target.value)}
                                            className="w-full bg-transparent border-b border-ink/10 py-1.5 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors text-ink/60"
                                        >
                                            <option value="">All colors</option>
                                            {colorNames.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="p-1.5 text-ink/25 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {isEdit && img.id && (
                                <button
                                    onClick={async () => {
                                        const newHero = !img.hero;
                                        await toggleHeroImage(img.id!, newHero);
                                        updateImageField(idx, 'hero', newHero);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                                        img.hero
                                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                            : 'border border-ink/10 text-ink/35 hover:text-ink/60 hover:border-ink/20'
                                    }`}
                                >
                                    <Image size={11} />
                                    {img.hero ? 'In Carousel' : 'Add to Carousel'}
                                </button>
                            )}
                        </div>
                    ))}

                    {images.length === 0 && (
                        <p className="text-center py-4 font-mono text-[13.5px] text-ink/25">No images yet</p>
                    )}
                </section>

                {/* ── Product Details (bullet points) ── */}
                <section className="border border-ink/8 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-ink/35">Product Details</h2>
                        <button
                            onClick={() => setDetails([...details, ''])}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11.5px] uppercase tracking-wider border border-ink/10 hover:bg-ink/5 transition-colors"
                        >
                            <Plus size={12} />
                            Add
                        </button>
                    </div>

                    {details.map((d, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                            <span className="font-mono text-[13.5px] text-ink/25 w-5 text-center shrink-0">{idx + 1}</span>
                            <input
                                value={d}
                                onChange={e => {
                                    const updated = [...details];
                                    updated[idx] = e.target.value;
                                    setDetails(updated);
                                }}
                                placeholder="e.g. 100% Cotton"
                                className="flex-1 bg-transparent border-b border-ink/10 py-1.5 font-mono text-[13.5px] focus:outline-none focus:border-ink/30 transition-colors placeholder:text-ink/20"
                            />
                            <button
                                onClick={() => setDetails(details.filter((_, i) => i !== idx))}
                                className="p-1 text-ink/20 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default ProductForm;
