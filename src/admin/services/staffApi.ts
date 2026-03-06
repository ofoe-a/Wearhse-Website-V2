const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
    return localStorage.getItem('staff_token');
}

async function staffFetch(path: string, options: RequestInit = {}) {
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
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
        window.location.href = '/staff/login';
        throw new Error('Session expired');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }

    return res.json();
}

// Auth
export async function staffLogin(email: string, password: string) {
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

    if (!['admin', 'printer', 'rider'].includes(data.user.role)) {
        throw new Error('Staff access required');
    }

    localStorage.setItem('staff_token', data.token);
    localStorage.setItem('staff_user', JSON.stringify(data.user));
    return data;
}

export function staffLogout() {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    window.location.href = '/staff/login';
}

export function getStaffUser() {
    const raw = localStorage.getItem('staff_user');
    return raw ? JSON.parse(raw) : null;
}

export function isStaffAuthenticated(): boolean {
    return !!getToken();
}

// Printer
export const fetchPrinterQueue = () => staffFetch('/printer/queue');
export const fetchPrinterStats = () => staffFetch('/printer/stats');
export const startPrinting = (orderId: string) =>
    staffFetch(`/printer/orders/${orderId}/start`, { method: 'PATCH' });
export const donePrinting = (orderId: string) =>
    staffFetch(`/printer/orders/${orderId}/done`, { method: 'PATCH' });
export const undoPrinting = (orderId: string) =>
    staffFetch(`/printer/orders/${orderId}/undo`, { method: 'PATCH' });
export const batchDispatch = (orderIds: string[]) =>
    staffFetch('/printer/batch-dispatch', {
        method: 'POST',
        body: JSON.stringify({ orderIds }),
    });

// Rider
export const fetchRiderDeliveries = () => staffFetch('/rider/deliveries');
export const fetchRiderStats = () => staffFetch('/rider/stats');
export const markDelivered = (orderId: string) =>
    staffFetch(`/rider/deliveries/${orderId}/delivered`, { method: 'PATCH' });
