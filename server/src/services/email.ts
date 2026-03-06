import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'WEARHSE <orders@wearhse.com>';

// ── Shared Styles ──────────────────────────────────────

const STYLES = {
    body: 'font-family: "Helvetica Neue", Arial, sans-serif; background-color: #f4f4f0; margin: 0; padding: 0;',
    container: 'max-width: 600px; margin: 0 auto; background: #ffffff;',
    header: 'background: #1a1a1a; padding: 32px 40px; text-align: center;',
    logo: 'font-family: "Helvetica Neue", Arial, sans-serif; font-size: 24px; font-weight: 900; color: #f4f4f0; letter-spacing: 6px; text-transform: uppercase; margin: 0;',
    content: 'padding: 40px;',
    heading: 'font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;',
    subtext: 'font-size: 14px; color: #888888; margin: 0 0 32px 0;',
    divider: 'border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;',
    label: 'font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;',
    value: 'font-size: 14px; color: #1a1a1a; margin: 0 0 16px 0;',
    itemRow: 'display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;',
    totalRow: 'display: flex; justify-content: space-between; padding: 16px 0; font-weight: 700; font-size: 16px;',
    button: 'display: inline-block; background: #1a1a1a; color: #f4f4f0; padding: 14px 32px; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-radius: 50px;',
    footer: 'padding: 32px 40px; text-align: center; font-size: 12px; color: #aaaaaa;',
    statusBadge: (color: string) => `display: inline-block; background: ${color}; color: #ffffff; padding: 6px 16px; border-radius: 50px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;`,
};

// ── Types ──────────────────────────────────────────────

interface OrderItem {
    productName: string;
    colorName: string;
    size: string;
    quantity: number;
    unitPrice: number; // pesewas
}

interface OrderEmailData {
    orderNumber: string;
    email: string;
    firstName: string;
    items: OrderItem[];
    subtotal: number;  // pesewas
    shipping: number;  // pesewas
    total: number;     // pesewas
    shippingAddress: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        region?: string;
    };
}

// ── Helpers ────────────────────────────────────────────

function formatGHS(pesewas: number): string {
    return `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function itemsHtml(items: OrderItem[]): string {
    return items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #1a1a1a;">
                ${item.productName}<br/>
                <span style="font-size: 12px; color: #888888;">${item.colorName} / ${item.size} &times; ${item.quantity}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #1a1a1a; text-align: right; white-space: nowrap;">
                ${formatGHS(item.unitPrice * item.quantity)}
            </td>
        </tr>
    `).join('');
}

function baseLayout(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${STYLES.body}">
    <div style="${STYLES.container}">
        <div style="${STYLES.header}">
            <h1 style="${STYLES.logo}">WEARHSE</h1>
        </div>
        <div style="${STYLES.content}">
            ${content}
        </div>
        <div style="${STYLES.footer}">
            <p>&copy; ${new Date().getFullYear()} WEARHSE. All rights reserved.</p>
            <p style="margin-top: 8px;">Made in Ghana</p>
        </div>
    </div>
</body>
</html>`;
}

// ── Email Templates ────────────────────────────────────

function orderConfirmationHtml(data: OrderEmailData): string {
    const trackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track`;

    return baseLayout(`
        <h2 style="${STYLES.heading}">Order Confirmed</h2>
        <p style="${STYLES.subtext}">Thanks for your order, ${data.firstName}! We've received your payment and are getting things ready.</p>

        <p style="${STYLES.label}">Order Number</p>
        <p style="${STYLES.value}; font-weight: 700; font-size: 18px;">${data.orderNumber}</p>

        <hr style="${STYLES.divider}" />

        <p style="${STYLES.label}">Items</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            ${itemsHtml(data.items)}
        </table>

        <hr style="${STYLES.divider}" />

        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="font-size: 14px; color: #888888; padding: 4px 0;">Subtotal</td>
                <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${formatGHS(data.subtotal)}</td>
            </tr>
            <tr>
                <td style="font-size: 14px; color: #888888; padding: 4px 0;">Shipping</td>
                <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${data.shipping === 0 ? 'Free' : formatGHS(data.shipping)}</td>
            </tr>
            <tr>
                <td style="font-size: 16px; font-weight: 700; color: #1a1a1a; padding: 12px 0; border-top: 2px solid #1a1a1a;">Total</td>
                <td style="font-size: 16px; font-weight: 700; color: #1a1a1a; text-align: right; padding: 12px 0; border-top: 2px solid #1a1a1a;">${formatGHS(data.total)}</td>
            </tr>
        </table>

        <hr style="${STYLES.divider}" />

        <p style="${STYLES.label}">Shipping To</p>
        <p style="font-size: 14px; color: #1a1a1a; margin: 0; line-height: 1.6;">
            ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br/>
            ${data.shippingAddress.addressLine1}<br/>
            ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '<br/>' : ''}
            ${data.shippingAddress.city}${data.shippingAddress.region ? ', ' + data.shippingAddress.region : ''}
        </p>

        <div style="text-align: center; margin-top: 32px;">
            <a href="${trackUrl}" style="${STYLES.button}">Track Your Order</a>
        </div>
    `);
}

function shippingUpdateHtml(data: {
    orderNumber: string;
    firstName: string;
    status: string;
    statusLabel: string;
    statusColor: string;
}): string {
    const trackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track`;

    const STATUS_MESSAGES: Record<string, string> = {
        processing: "We're preparing your order for printing.",
        printed: "Your items have been printed and are being prepared for shipping.",
        ready_for_pickup: "Your order is packed and ready for the delivery rider.",
        shipped: "Your order is on its way! Our rider is heading to your location.",
        delivered: "Your order has been delivered. We hope you love it!",
    };

    const message = STATUS_MESSAGES[data.status] || `Your order status has been updated to ${data.statusLabel}.`;

    return baseLayout(`
        <h2 style="${STYLES.heading}">Order Update</h2>
        <p style="${STYLES.subtext}">Hi ${data.firstName}, here's an update on your order.</p>

        <p style="${STYLES.label}">Order Number</p>
        <p style="${STYLES.value}; font-weight: 700;">${data.orderNumber}</p>

        <p style="${STYLES.label}">Status</p>
        <p style="margin: 0 0 24px 0;">
            <span style="${STYLES.statusBadge(data.statusColor)}">${data.statusLabel}</span>
        </p>

        <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6; margin: 0 0 32px 0;">
            ${message}
        </p>

        <div style="text-align: center;">
            <a href="${trackUrl}" style="${STYLES.button}">Track Your Order</a>
        </div>
    `);
}

// ── Send Functions ─────────────────────────────────────

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        console.log('⚠ RESEND_API_KEY not set — skipping order confirmation email');
        return;
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.email,
            subject: `Order Confirmed — ${data.orderNumber}`,
            html: orderConfirmationHtml(data),
        });
        console.log(`✉ Order confirmation sent to ${data.email} for ${data.orderNumber}`);
    } catch (err) {
        console.error('✗ Failed to send order confirmation:', err);
        // Don't throw — email failure shouldn't break the checkout flow
    }
}

export async function sendShippingUpdate(data: {
    email: string;
    orderNumber: string;
    firstName: string;
    status: string;
}): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        console.log('⚠ RESEND_API_KEY not set — skipping shipping update email');
        return;
    }

    const STATUS_META: Record<string, { label: string; color: string }> = {
        processing: { label: 'Processing', color: '#7c3aed' },
        printed: { label: 'Printed', color: '#8b5cf6' },
        ready_for_pickup: { label: 'Ready for Pickup', color: '#ea580c' },
        shipped: { label: 'Shipped', color: '#4f46e5' },
        delivered: { label: 'Delivered', color: '#16a34a' },
    };

    const meta = STATUS_META[data.status];
    if (!meta) return; // Don't email for pending/confirmed/cancelled

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.email,
            subject: `Order ${data.orderNumber} — ${meta.label}`,
            html: shippingUpdateHtml({
                orderNumber: data.orderNumber,
                firstName: data.firstName,
                status: data.status,
                statusLabel: meta.label,
                statusColor: meta.color,
            }),
        });
        console.log(`✉ Shipping update (${meta.label}) sent to ${data.email} for ${data.orderNumber}`);
    } catch (err) {
        console.error('✗ Failed to send shipping update:', err);
    }
}
