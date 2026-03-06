import { resolveImageUrl } from '../utils/imageUrl';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Raw API response types (from backend) ──

interface ApiVariant {
    id: string;
    colorName: string;
    colorHex: string;
    size: string;
    pricePesewas: number;
    sku: string;
    stock: number;
    sortOrder?: number;
}

interface ApiImage {
    id: string;
    url: string;
    altText: string | null;
    colorName: string | null;
    sortOrder: number;
    hero: boolean;
}

interface ApiDetail {
    detail: string;
    sortOrder: number;
}

interface ApiProduct {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    featured: boolean;
    variants: ApiVariant[];
    images: ApiImage[];
    details: ApiDetail[];
}

// ── Frontend types ──

export interface ColorVariant {
    name: string;
    hex: string;
    image: string;
    images: string[];
    sizes: {
        size: string;
        variantId: string;
        pricePesewas: number;
        stock: number;
        sku: string;
    }[];
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    price: string;
    description: string;
    details: string[];
    category: string;
    featured: boolean;
    variants: ColorVariant[];
    heroImages: string[]; // URLs of images flagged for hero carousel
}

// ── Transform API product → Frontend product ──

function transformProduct(api: ApiProduct): Product {
    // Sort variants by sort_order first so colorMap preserves insertion order
    const sortedVariants = [...api.variants].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    // Group variants by color (Map preserves insertion order)
    const colorMap = new Map<string, {
        hex: string;
        sizes: ColorVariant['sizes'];
    }>();

    for (const v of sortedVariants) {
        if (!colorMap.has(v.colorName)) {
            colorMap.set(v.colorName, { hex: v.colorHex, sizes: [] });
        }
        colorMap.get(v.colorName)!.sizes.push({
            size: v.size,
            variantId: v.id,
            pricePesewas: v.pricePesewas,
            stock: v.stock,
            sku: v.sku,
        });
    }

    // Group images by color + collect hero images
    const imageMap = new Map<string, string[]>();
    const heroImages: string[] = [];
    const sortedImages = [...api.images].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const img of sortedImages) {
        const key = img.colorName || '__all__';
        if (!imageMap.has(key)) imageMap.set(key, []);
        imageMap.get(key)!.push(resolveImageUrl(img.url));
        if (img.hero) heroImages.push(resolveImageUrl(img.url));
    }

    // Build color variants
    const variants: ColorVariant[] = [];
    for (const [colorName, data] of colorMap) {
        const colorImages = imageMap.get(colorName) || imageMap.get('__all__') || [];
        variants.push({
            name: colorName,
            hex: data.hex,
            image: colorImages[0] || '',
            images: colorImages,
            sizes: data.sizes,
        });
    }

    // Get min/max price across all variants for display
    const allPrices = api.variants.map(v => v.pricePesewas).filter(p => p > 0);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) / 100 : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) / 100 : 0;

    // Sort details
    const details = [...api.details]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(d => d.detail);

    return {
        id: api.id,
        name: api.name,
        slug: api.slug,
        price: minPrice === maxPrice ? `GHS ${minPrice}` : `From GHS ${minPrice}`,
        description: api.description,
        details,
        category: api.category,
        featured: api.featured,
        variants,
        heroImages,
    };
}

// ── API functions ──

export async function fetchProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data: ApiProduct[] = await res.json();
    return data.map(transformProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
    const res = await fetch(`${API_BASE}/products/${slug}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch product');
    const data: ApiProduct = await res.json();
    return transformProduct(data);
}

export async function fetchProductById(id: string): Promise<Product | null> {
    // Fetch all products and find by ID (since backend uses slug-based lookup)
    const products = await fetchProducts();
    return products.find(p => p.id === id) || null;
}

// ── Shipping Zones ──

export async function fetchShippingZones() {
    const res = await fetch(`${API_BASE}/shipping/zones`);
    if (!res.ok) throw new Error('Failed to fetch shipping zones');
    return res.json();
}

// ── Auth ──

export async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
    }
    return res.json();
}

export async function register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
    }
    return res.json();
}

// ── Checkout ──

export interface CheckoutData {
    email: string;
    phone?: string;
    userId?: string;
    shipping: {
        firstName: string;
        lastName: string;
        phone?: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        region?: string;
        zone?: string;
    };
    items: {
        variantId: string;
        quantity: number;
    }[];
}

export interface CheckoutResponse {
    orderId: string;
    orderNumber: string;
    reference: string;
    authorizationUrl: string;
    accessCode: string;
    total: number;
}

export async function checkout(data: CheckoutData): Promise<CheckoutResponse> {
    const res = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Checkout failed');
    }
    return res.json();
}

export async function verifyPayment(reference: string) {
    const res = await fetch(`${API_BASE}/orders/verify/${reference}`);
    if (!res.ok) throw new Error('Verification failed');
    return res.json();
}

// ── Order Tracking ──

export interface TrackedOrder {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    shipping: number;
    total: number;
    city: string;
    region: string | null;
    createdAt: string;
    items: { productName: string; colorName: string; size: string; quantity: number }[];
}

export async function trackOrder(orderNumber: string, email: string): Promise<TrackedOrder> {
    const res = await fetch(`${API_BASE}/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
    if (res.status === 404) {
        const err = await res.json();
        throw new Error(err.error || 'Order not found');
    }
    if (!res.ok) throw new Error('Failed to track order');
    return res.json();
}
