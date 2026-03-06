/**
 * Resolve an image URL for display.
 *
 * In development, Vite proxy handles /uploads → localhost:4000
 * In production, we prepend the API base URL so images load from the backend
 */
const API_URL = import.meta.env.VITE_API_URL || '';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (BACKEND_ORIGIN && url.startsWith('/uploads')) {
        return `${BACKEND_ORIGIN}${url}`;
    }
    return url;
}
