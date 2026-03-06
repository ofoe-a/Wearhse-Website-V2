import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = 'https://api.paystack.co';

interface PaystackInitResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        status: string; // 'success' | 'failed' | 'abandoned'
        reference: string;
        amount: number; // in pesewas
        currency: string;
        customer: {
            email: string;
        };
        metadata: Record<string, unknown>;
    };
}

/**
 * Initialize a Paystack transaction
 * Amount is in pesewas (GHS 450 = 45000)
 */
export async function initializeTransaction(params: {
    email: string;
    amount: number;
    reference: string;
    metadata?: Record<string, unknown>;
    callback_url?: string;
}): Promise<PaystackInitResponse> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: params.email,
            amount: params.amount,
            reference: params.reference,
            currency: 'GHS',
            metadata: params.metadata || {},
            callback_url: params.callback_url,
        }),
    });

    const data = await res.json() as PaystackInitResponse;
    if (!data.status) {
        throw new Error(`Paystack init failed: ${data.message}`);
    }
    return data;
}

/**
 * Verify a Paystack transaction by reference
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
    });

    const data = await res.json() as PaystackVerifyResponse;
    return data;
}

/**
 * Validate a Paystack webhook signature
 */
export function validateWebhookSignature(body: string, signature: string): boolean {
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET)
        .update(body)
        .digest('hex');
    return hash === signature;
}

/**
 * Generate a unique transaction reference
 */
export function generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `WH-${timestamp}-${random}`.toUpperCase();
}
