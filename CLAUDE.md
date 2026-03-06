# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**wearhse** — a fashion e-commerce storefront built with React 19, TypeScript, Vite 7, and Tailwind CSS v4.

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint across the project
- `npm run preview` — Preview production build locally

## Architecture

**Routing:** React Router v7 (`BrowserRouter`). Two routes:
- `/` → `Home` page
- `/product/:id` → `ProductDetails` page

**State Management:** Cart state lives in `src/context/CartContext.tsx` using React Context. The `CartProvider` wraps the entire app above `BrowserRouter`. Access cart via `useCart()` hook.

**Layout Pattern:** All pages wrap content in `MainContainer`, which provides the base layout (background, grain overlay) and renders `CartDrawer` globally. Pages include `Navbar` themselves.

**Product Data:** Currently hardcoded — `PRODUCT_DATA` array is duplicated in `ProductDetails.tsx` and `ShopSection.tsx`. No API layer exists yet. Cart items are keyed by `(id, size)` pairs.

## Component Organization

```
src/
  pages/          — Route-level page components (Home, ProductDetails)
  components/
    layout/       — MainContainer (base wrapper + CartDrawer)
    nav/          — Navbar (responsive, mobile overlay menu)
    cart/          — CartDrawer (slide-in panel from right)
    home/         — HeroSection, ShopSection, CollectionPreview
  context/        — CartContext (provider + useCart hook)
```

## Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (not PostCSS config)
- Custom theme tokens defined in `src/index.css` under `@theme`:
  - Colors: `bone` (#f4f4f0), `ink` (#1a1a1a), `accent-gray` (#888888)
  - Fonts: `sans` (Inter), `display` (Archivo Black), `mono` (Space Mono)
- Google Fonts loaded via CSS `@import` in `index.css`
- Icons from `lucide-react`
- Mobile-first responsive design with `md:` breakpoints throughout
- `App.css` is leftover Vite template boilerplate (unused)

## Key Patterns

- Price format is `"XXXX $"` (string, parsed with regex in CartDrawer subtotal calculation)
- Cart auto-opens when an item is added; toast notification appears for 3 seconds
- `Navbar` accepts `showBackButton` prop for product detail pages
- Hero section auto-cycles between two model images every 4 seconds
- Product grid is horizontally scrollable on mobile, grid layout on desktop
