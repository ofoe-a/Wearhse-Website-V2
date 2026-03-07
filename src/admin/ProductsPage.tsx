import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Package, EyeOff, Star, Trash2 } from 'lucide-react';
import { fetchAdminProducts, deleteProduct } from './services/adminApi';

interface AdminProduct {
    id: string;
    name: string;
    slug: string;
    category: string;
    featured: boolean;
    active: boolean;
    variantCount: number;
    totalStock: number;
    minPrice: number;
    thumbnail: string | null;
    createdAt: string;
}

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchAdminProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (e: React.MouseEvent, product: AdminProduct) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(`Delete "${product.name}"? This will remove all variants, images, and related data. This cannot be undone.`)) {
            return;
        }

        setDeleting(product.id);
        try {
            await deleteProduct(product.id);
            setProducts(prev => prev.filter(p => p.id !== product.id));
        } catch (err) {
            console.error('Failed to delete product:', err);
            alert('Failed to delete product. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-display text-2xl uppercase">Products</h1>
                <Link
                    to="/admin/products/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-[13.5px] uppercase tracking-wider bg-ink text-bone hover:bg-ink/85 transition-colors"
                >
                    <Plus size={14} />
                    Add Product
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="border border-ink/8 rounded-xl py-16 text-center">
                    <Package size={32} className="mx-auto text-ink/15 mb-4" />
                    <p className="font-mono text-sm text-ink/30 mb-4">No products yet</p>
                    <Link
                        to="/admin/products/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[13.5px] bg-ink text-bone hover:bg-ink/85 transition-colors"
                    >
                        <Plus size={14} />
                        Add your first product
                    </Link>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                        <div key={product.id} className="relative group">
                            <Link
                                to={`/admin/products/${product.id}/edit`}
                                className="block border border-ink/8 rounded-xl overflow-hidden hover:border-ink/20 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-[4/3] bg-ink/5 overflow-hidden">
                                    {product.thumbnail ? (
                                        <img
                                            src={product.thumbnail}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package size={32} className="text-ink/10" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-mono text-sm font-medium leading-tight">{product.name}</h3>
                                        <div className="flex gap-1 shrink-0">
                                            {product.featured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                                            {!product.active && <EyeOff size={12} className="text-ink/25" />}
                                        </div>
                                    </div>

                                    {product.category && (
                                        <p className="font-mono text-[11.5px] uppercase tracking-widest text-ink/30 mb-3">{product.category}</p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[13.5px] text-ink/40">
                                            {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className={`font-mono text-[13.5px] ${product.totalStock < 5 ? 'text-red-500' : 'text-ink/40'}`}>
                                            {product.totalStock} in stock
                                        </span>
                                    </div>

                                    {product.minPrice > 0 && (
                                        <p className="font-mono text-sm font-medium mt-2">From GHS {product.minPrice.toFixed(2)}</p>
                                    )}
                                </div>
                            </Link>

                            {/* Delete button — always visible */}
                            <button
                                onClick={(e) => handleDelete(e, product)}
                                disabled={deleting === product.id}
                                className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-all duration-200 shadow-md disabled:opacity-50 z-10"
                                title={`Delete ${product.name}`}
                            >
                                {deleting === product.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
