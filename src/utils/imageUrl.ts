/**
 * Resolve an image URL for display.
 *
 * - Relative paths like "/uploads/abc.jpg" are returned as-is (Vite proxy handles them)
 * - Full URLs (http/https) are returned as-is
 * - Empty strings return empty string
 */
export function resolveImageUrl(url: string): string {
    if (!url) return '';
    return url;
}
