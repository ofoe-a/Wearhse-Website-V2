import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchProducts, type Product } from '../services/api';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';

interface ProductsContextType {
    products: Product[];
    loading: boolean;
    error: string | null;
    getProductById: (id: string) => Product | undefined;
    getFeaturedProducts: () => Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Convert hardcoded products to API format as fallback
function convertFallback(): Product[] {
    return FALLBACK_PRODUCTS.map(p => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        price: p.price,
        description: p.description,
        details: p.details,
        category: p.category,
        featured: p.featured || false,
        heroImages: [],
        variants: p.variants.map(v => ({
            name: v.name,
            hex: v.hex,
            image: v.image,
            images: v.images,
            sizes: ['S', 'M', 'L', 'XL'].map(size => ({
                size,
                variantId: `fallback-${p.id}-${v.name}-${size}`,
                pricePesewas: 45000,
                stock: 25,
                sku: `FB-${v.name}-${size}`,
            })),
        })),
    }));
}

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchProducts();
                if (!cancelled) {
                    setProducts(data);
                    setLoading(false);
                }
            } catch (err) {
                console.warn('API unavailable, using fallback data:', err);
                if (!cancelled) {
                    setProducts(convertFallback());
                    setError('Using offline data');
                    setLoading(false);
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    const getProductById = (id: string) => products.find(p => p.id === id);
    const getFeaturedProducts = () => products.filter(p => p.featured);

    return (
        <ProductsContext.Provider value={{ products, loading, error, getProductById, getFeaturedProducts }}>
            {children}
        </ProductsContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) throw new Error('useProducts must be used within a ProductsProvider');
    return context;
};
