# Styling and Assets

## Preserve

- Tailwind CSS 4 design tokens in `src/styles.css`.
- Radix/shadcn primitives, class-variance-authority, `clsx`, and `tailwind-merge`.
- Figtree visual identity, favicon, Lucide icons, and Lovable asset manifests during parity.

## Change or verify

- Replace Vite CSS URL import with root layout CSS import.
- Reassess `components.json` (`rsc:false`) and client directives component-by-component.
- Use `next/font` only after visual and privacy parity is verified.
- Decide whether external R2/CDN assets use `next/image`; configure remote patterns and Cloudflare image behavior if selected.
- Keep Leaflet CSS/client loading isolated.

No visual redesign is part of migration.
