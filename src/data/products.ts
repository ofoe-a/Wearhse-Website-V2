export interface ColorVariant {
    name: string;
    hex: string;
    image: string;        // primary image for this color
    images: string[];     // all images for this color (front, back, lifestyle, etc.)
}

export interface Product {
    id: number;
    name: string;
    price: string;
    slug: string;
    description: string;
    details: string[];
    category: string;
    featured?: boolean;
    variants: ColorVariant[];
}

export const PRODUCTS: Product[] = [
    {
        id: 1,
        name: '"Ghana to the Wiase" Tee',
        slug: 'ghana-to-the-wiase-tee',
        price: 'GHS 450',
        category: 'tops',
        featured: true,
        variants: [
            {
                name: 'White',
                hex: '#ffffff',
                image: '/uploads/ghana-to-the-wiase-white-front.webp',
                images: [
                    '/uploads/ghana-to-the-wiase-white-front.webp',
                    '/uploads/ghana-to-the-wiase-white-back.webp',
                ],
            },
            {
                name: 'Black',
                hex: '#1a1a1a',
                image: '/uploads/ghana-to-the-wiase-black-front.webp',
                images: [
                    '/uploads/ghana-to-the-wiase-black-front.webp',
                    '/uploads/ghana-to-the-wiase-black-couple.webp',
                ],
            },
        ],
        description: "Rep where you're from. The \"Ghana to the Wiase\" tee — oversized fit, premium cotton, and the culture on your chest.",
        details: ["100% Premium Cotton", "Oversized Fit", "Screen Printed", "Handfinished in Accra"],
    },
];

export const getProductById = (id: number): Product | undefined => {
    return PRODUCTS.find(p => p.id === id);
};

export const getProductBySlug = (slug: string): Product | undefined => {
    return PRODUCTS.find(p => p.slug === slug);
};
