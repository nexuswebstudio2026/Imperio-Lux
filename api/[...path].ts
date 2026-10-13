// Route every /api/* request through the existing Express application.
// Vercel otherwise serves the Vite SPA's HTML for these paths.
export { default } from '../server';
