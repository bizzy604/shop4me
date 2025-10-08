This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🎨 Theme System

This application features a **neobrutalist design theme** with:
- **Bold Colors:** Red primary, yellow secondary, blue accent
- **Sharp Edges:** Zero border radius for geometric shapes
- **Strong Borders:** 2px borders throughout
- **Hard Shadows:** 4x4px offset shadows with no blur
- **Typography:** DM Sans & Space Mono fonts
- **Dark Mode:** Full support with optimized color palette

### Quick Start with Theme
```bash
npm run dev
```

Then visit `/theme` (create a page importing `ThemeShowcase`) to see all theme elements.

### Theme Documentation
- **Quick Reference:** See `THEME_QUICK_REFERENCE.md` for code examples
- **Full Docs:** See `THEME_SYSTEM.md` for complete documentation
- **Implementation:** See `THEME_IMPLEMENTATION.md` for changes made

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stack authentication setup

Authentication and registration are powered by [Stack](https://stack-auth.com/). The Stack UI will automatically appear once the required environment variables are configured.

### Required environment variables

Create a `.env.local` file (or update your deployment secrets) with the following keys:

```
NEXT_PUBLIC_STACK_PROJECT_ID="<your-stack-project-id>"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="<your-stack-publishable-key>"
STACK_SECRET_SERVER_KEY="<your-stack-secret-server-key>"
```

Restart the dev server after adding the values. When these variables are missing, sign-in and sign-up pages will display a helpful configuration warning and protected routes will stay publicly accessible so the rest of the app can still be previewed.

### Handler route

Stack relies on `/auth/stack/*` for email verification, password reset, OAuth callbacks, and other auth flows. This repository already exposes that handler through `app/auth/stack/[...stack]/page.tsx`. If you customise the base path, update `STACK_URLS` in `src/lib/stack-config.ts` accordingly.

### Protected routes

Once credentials are in place, `/admin`, `/orders`, and `/checkout/confirmation` require a signed-in session. Adjust the list inside `src/middleware.ts` if additional pages should be locked down.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
