const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
    return localStorage.getItem('admin_token');
}

async function adminFetch(path: string, options: RequestInit = {}) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
        throw new Error('Session expired');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }

    return res.json();
}

// Auth
export async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();

    if (data.user.role !== 'admin') {
        throw new Error('Admin access required');
    }

    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
}

export function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
}

export function getStoredUser() {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

// Dashboard
export const fetchDashboard = () => adminFetch('/admin/dashboard');

// Orders
export const fetchOrders = (params?: { status?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'all') qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    return adminFetch(`/admin/orders?${qs.toString()}`);
};

export const fetchOrder = (id: string) => adminFetch(`/admin/orders/${id}`);

export const updateOrderStatus = (id: string, status: string) =>
    adminFetch(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

// Products
export const fetchAdminProducts = () => adminFetch('/admin/products');
export const fetchAdminProduct = (id: string) => adminFetch(`/admin/products/${id}`);

export const createProduct = (data: any) =>
    adminFetch('/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id: string, data: any) =>
    adminFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteProduct = (id: string) =>
    adminFetch(`/admin/products/${id}`, { method: 'DELETE' });

export const updateVariant = (id: string, data: { stock?: number; pricePesewas?: number }) =>
    adminFetch(`/admin/variants/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Reorder colors for a product
export const reorderColors = (productId: string, colorOrder: string[]) =>
    adminFetch(`/admin/products/${productId}/reorder-colors`, {
        method: 'PATCH',
        body: JSON.stringify({ colorOrder }),
    });

// Add new variants to existing product
export const addVariants = (productId: string, variants: any[]) =>
    adminFetch(`/admin/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify({ variants }),
    });

// Add new images to existing product
export const addImages = (productId: string, images: any[]) =>
    adminFetch(`/admin/products/${productId}/images`, {
        method: 'POST',
        body: JSON.stringify({ images }),
    });

// Delete image
export const deleteImage = (imageId: string) =>
    adminFetch(`/admin/images/${imageId}`, { method: 'DELETE' });

// Reorder images
export const reorderImages = (productId: string, imageIds: string[]) =>
    adminFetch(`/admin/products/${productId}/images/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ imageIds }),
    });

// Hero images
export const toggleHeroImage = (imageId: string, hero: boolean) =>
    adminFetch(`/admin/images/${imageId}/hero`, { method: 'PATCH', body: JSON.stringify({ hero }) });

export const fetchHeroImages = () => adminFetch('/admin/hero-images');

// Team
export const fetchTeam = () => adminFetch('/admin/team');

export const inviteTeamMember = (data: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) =>
    adminFetch('/admin/team/invite', { method: 'POST', body: JSON.stringify(data) });

export const updateTeamRole = (id: string, role: string) =>
    adminFetch(`/admin/team/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });

// Image upload
export async function uploadImages(files: File[]): Promise<{ url: string; filename: string; originalName: string }[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
    }

    return res.json();
}

// Shipping zones
export const fetchShippingZones = () => adminFetch('/admin/shipping-zones');

export const createShippingZone = (data: { name: string; label: string; description?: string; costPesewas: number; sortOrder?: number }) =>
    adminFetch('/admin/shipping-zones', { method: 'POST', body: JSON.stringify(data) });

export const updateShippingZone = (id: string, data: { label?: string; description?: string; costPesewas?: number; active?: boolean; sortOrder?: number }) =>
    adminFetch(`/admin/shipping-zones/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteShippingZone = (id: string) =>
    adminFetch(`/admin/shipping-zones/${id}`, { method: 'DELETE' });

// Rider assignment
export const fetchReadyForPickup = () => adminFetch('/admin/ready-for-pickup');

export const assignRider = (orderId: string, riderId: string) =>
    adminFetch(`/admin/orders/${orderId}/assign-rider`, {
        method: 'PATCH',
        body: JSON.stringify({ riderId }),
    });
